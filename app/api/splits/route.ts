import { after } from "next/server";
import { FeedbackUnavailableError, hashIp, rateLimitHit, rateLimited, withDb } from "@/lib/turso";
import {
	SPLIT_ID_RE, SPLIT_TTL_MS, cleanBlob, cleanToken, hashToken, insertSplit, overLimit, purgeExpired, readSmallJson, reply, sameOrigin,
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
	// Room for an itemised bill of up to 40 lines.
	const blob = cleanBlob(body?.blob, 6000);
	if (!id || !token || !blob) return reply({ error: "Invalid split" }, 400);

	try {
		return await withDb(async (db) => {
			const hit = await rateLimitHit(db, "splits", ipHash);
			if (hit) return rateLimited(hit, "new splits");
			const now = Date.now();
			const result = await insertSplit(db, { id, writeHash: hashToken(token), blob, ipHash, now });
			if (result === "busy") return reply({ error: "Busy" }, 503, { "Retry-After": "600" });
			if (result === "exists") return reply({ error: "Split already exists" }, 409);
			// Housekeeping runs after the response, so it never slows the person down.
			after(() => purgeExpired(db).catch((e) => console.error("split purge failed", (e as Error).message)));
			return reply({ ok: true, expiresAt: now + SPLIT_TTL_MS }, 201);
		});
	} catch (err) {
		if (err instanceof FeedbackUnavailableError) return reply({ error: "Offline" }, 503);
		console.error("split create failed", (err as Error).message);
		return reply({ error: "Couldn't save the split" }, 500);
	}
}
