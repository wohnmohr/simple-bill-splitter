import { randomUUID } from "crypto";
import { FeedbackUnavailableError, ensureSchema, getDb, hashIp, isRateLimited } from "@/lib/turso";
import { MAX_PAYMENTS, SPLIT_ID_RE, cleanBlob, cleanToken, overLimit, readSmallJson, reply, sameOrigin, tokenMatches } from "@/lib/splitStore";

export const runtime = "nodejs";

/** Appends one encrypted payment. Only someone holding the link can produce a valid token. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	if (!sameOrigin(req)) return reply({ error: "Forbidden" }, 403);
	const ipHash = hashIp(req);
	if (overLimit(`pay:${ipHash}`, 20)) return reply({ error: "Slow down" }, 429, { "Retry-After": "60" });

	const body = await readSmallJson(req);
	const token = cleanToken(body?.token);
	const blob = cleanBlob(body?.blob, 400);
	if (!SPLIT_ID_RE.test(id) || !token || !blob) return reply({ error: "Invalid payment" }, 400);

	try {
		const db = getDb();
		await ensureSchema(db);
		const now = Date.now();
		const split = await db.execute({ sql: "SELECT write_hash FROM splits WHERE id = ? AND expires_at > ?", args: [id, now] });
		const row = split.rows[0];
		// Same answer for "no such split" and "wrong token", so ids can't be probed.
		if (!row || !tokenMatches(token, String(row.write_hash))) return reply({ error: "Not found" }, 404);
		if (await isRateLimited(db, "split_payments", ipHash, 60)) {
			return reply({ error: "Too many updates this hour. Try again later." }, 429, { "Retry-After": "3600" });
		}
		// Claim a slot atomically, so concurrent requests can't push a split past the cap.
		const slot = await db.execute({
			sql: "UPDATE splits SET payments = payments + 1 WHERE id = ? AND payments < ? AND expires_at > ?",
			args: [id, MAX_PAYMENTS, now],
		});
		if (slot.rowsAffected === 0) return reply({ error: "This split is full" }, 409);
		await db.execute({
			sql: "INSERT INTO split_payments (id, split_id, created_at, blob, ip_hash) VALUES (?, ?, ?, ?, ?)",
			args: [randomUUID(), id, now, blob, ipHash],
		});
		return reply({ ok: true }, 201);
	} catch (err) {
		if (err instanceof FeedbackUnavailableError) return reply({ error: "Offline" }, 503);
		console.error("split payment failed", (err as Error).message);
		return reply({ error: "Couldn't save the payment" }, 500);
	}
}
