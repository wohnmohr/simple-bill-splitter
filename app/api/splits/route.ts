import { FeedbackUnavailableError, ensureSchema, getDb, hashIp, isRateLimited } from "@/lib/turso";
import { NO_STORE, SPLIT_ID_RE, SPLIT_TTL_MS, cleanBlob, cleanToken, hashToken } from "@/lib/splitStore";

export const runtime = "nodejs";

/** Stores a new end-to-end encrypted split. The body holds ciphertext and a write token only. */
export async function POST(req: Request) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return Response.json({ error: "Invalid request" }, { status: 400, headers: NO_STORE });
	}
	const id = typeof body.id === "string" && SPLIT_ID_RE.test(body.id) ? body.id : null;
	const token = cleanToken(body.token);
	const blob = cleanBlob(body.blob, 4000);
	if (!id || !token || !blob) return Response.json({ error: "Invalid split" }, { status: 400, headers: NO_STORE });

	try {
		const db = getDb();
		await ensureSchema(db);
		const ipHash = hashIp(req);
		if (await isRateLimited(db, "splits", ipHash, 30)) {
			return Response.json({ error: "Too many splits this hour. Try again later." }, { status: 429, headers: NO_STORE });
		}
		const now = Date.now();
		const res = await db.execute({
			sql: `INSERT INTO splits (id, created_at, expires_at, write_hash, blob, ip_hash) VALUES (?, ?, ?, ?, ?, ?)
			      ON CONFLICT (id) DO NOTHING`,
			args: [id, now, now + SPLIT_TTL_MS, hashToken(token), blob, ipHash],
		});
		if (res.rowsAffected === 0) return Response.json({ error: "Split already exists" }, { status: 409, headers: NO_STORE });
		return Response.json({ ok: true }, { status: 201, headers: NO_STORE });
	} catch (err) {
		if (err instanceof FeedbackUnavailableError) return Response.json({ error: "Offline" }, { status: 503, headers: NO_STORE });
		console.error("split create failed", (err as Error).message);
		return Response.json({ error: "Couldn't save the split" }, { status: 500, headers: NO_STORE });
	}
}
