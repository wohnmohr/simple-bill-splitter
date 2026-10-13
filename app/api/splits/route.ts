import { FeedbackUnavailableError, ensureSchema, getDb, hashIp, rateLimitHit, rateLimited } from "@/lib/turso";
import {
	SPLIT_ID_RE, SPLIT_TTL_MS, cleanBlob, cleanToken, hashToken, overLimit, purgeExpired, readSmallJson, reply, sameOrigin, takeGlobalSlot,
} from "@/lib/splitStore";

export const runtime = "nodejs";

/** Stores a new end-to-end encrypted split. The body holds ciphertext and a write token only. */
export async function POST(req: Request) {
	if (!sameOrigin(req)) return reply({ error: "Forbidden" }, 403);
	const ipHash = hashIp(req);
	if (overLimit(`create:${ipHash}`, 10)) return reply({ error: "Slow down" }, 429, { "Retry-After": "60" });

	const body = await readSmallJson(req);
	const id = typeof body?.id === "string" && SPLIT_ID_RE.test(body.id) ? body.id : null;
	const token = cleanToken(body?.token);
	const blob = cleanBlob(body?.blob, 4000);
	if (!id || !token || !blob) return reply({ error: "Invalid split" }, 400);

	try {
		const db = getDb();
		await ensureSchema(db);
		const hit = await rateLimitHit(db, "splits", ipHash);
		if (hit) return rateLimited(hit, "new splits");
		if (!(await takeGlobalSlot(db))) return reply({ error: "Busy" }, 503, { "Retry-After": "600" });
		const now = Date.now();
		const res = await db.execute({
			sql: `INSERT INTO splits (id, created_at, expires_at, write_hash, blob, ip_hash) VALUES (?, ?, ?, ?, ?, ?)
			      ON CONFLICT (id) DO NOTHING`,
			args: [id, now, now + SPLIT_TTL_MS, hashToken(token), blob, ipHash],
		});
		if (res.rowsAffected === 0) return reply({ error: "Split already exists" }, 409);
		await purgeExpired(db).catch((e) => console.error("split purge failed", (e as Error).message));
		return reply({ ok: true, expiresAt: now + SPLIT_TTL_MS }, 201);
	} catch (err) {
		if (err instanceof FeedbackUnavailableError) return reply({ error: "Offline" }, 503);
		console.error("split create failed", (err as Error).message);
		return reply({ error: "Couldn't save the split" }, 500);
	}
}
