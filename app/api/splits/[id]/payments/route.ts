import { randomUUID } from "crypto";
import { FeedbackUnavailableError, ensureSchema, getDb, hashIp, isRateLimited } from "@/lib/turso";
import { MAX_PAYMENTS, NO_STORE, SPLIT_ID_RE, cleanBlob, cleanToken, tokenMatches } from "@/lib/splitStore";

export const runtime = "nodejs";

/** Appends one encrypted payment. Only someone holding the link can produce a valid token. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return Response.json({ error: "Invalid request" }, { status: 400, headers: NO_STORE });
	}
	const token = cleanToken(body.token);
	const blob = cleanBlob(body.blob, 600);
	if (!SPLIT_ID_RE.test(id) || !token || !blob) return Response.json({ error: "Invalid payment" }, { status: 400, headers: NO_STORE });

	try {
		const db = getDb();
		await ensureSchema(db);
		const split = await db.execute({ sql: "SELECT write_hash FROM splits WHERE id = ? AND expires_at > ?", args: [id, Date.now()] });
		const row = split.rows[0];
		// Same answer for "no such split" and "wrong token", so ids can't be probed.
		if (!row || !tokenMatches(token, String(row.write_hash))) {
			return Response.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
		}
		const ipHash = hashIp(req);
		if (await isRateLimited(db, "split_payments", ipHash, 60)) {
			return Response.json({ error: "Too many updates this hour. Try again later." }, { status: 429, headers: NO_STORE });
		}
		const count = await db.execute({ sql: "SELECT COUNT(*) AS n FROM split_payments WHERE split_id = ?", args: [id] });
		if (Number(count.rows[0]?.n ?? 0) >= MAX_PAYMENTS) {
			return Response.json({ error: "This split is full" }, { status: 409, headers: NO_STORE });
		}
		await db.execute({
			sql: "INSERT INTO split_payments (id, split_id, created_at, blob, ip_hash) VALUES (?, ?, ?, ?, ?)",
			args: [randomUUID(), id, Date.now(), blob, ipHash],
		});
		return Response.json({ ok: true }, { status: 201, headers: NO_STORE });
	} catch (err) {
		if (err instanceof FeedbackUnavailableError) return Response.json({ error: "Offline" }, { status: 503, headers: NO_STORE });
		console.error("split payment failed", (err as Error).message);
		return Response.json({ error: "Couldn't save the payment" }, { status: 500, headers: NO_STORE });
	}
}
