import { randomUUID } from "crypto";
import { FeedbackUnavailableError, hashIp, rateLimitQuery, rateLimitVerdict, rateLimited, withDb } from "@/lib/turso";
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
		return await withDb(async (db) => {
			const now = Date.now();
			// The split's write hash and this IP's recent payments, in one round trip.
			const [split, recent] = await db.batch(
				[{ sql: "SELECT write_hash FROM splits WHERE id = ? AND expires_at > ?", args: [id, now] }, rateLimitQuery("split_payments", ipHash)],
				"read"
			);
			const row = split.rows[0];
			// Same answer for "no such split" and "wrong token", so ids can't be probed.
			if (!row || !tokenMatches(token, String(row.write_hash))) return reply({ error: "Not found" }, 404);
			const hit = rateLimitVerdict("split_payments", recent.rows[0]);
			if (hit) return rateLimited(hit, "payment updates");
			// One transaction: the cap check, the new row and the version that announces it
			// commit together. Parallel marks queue behind each other, none is lost, and a
			// poll never sees the new version without the row (it would then miss it for good).
			const [inserted] = await db.batch(
				[
					{
						sql: `INSERT INTO split_payments (id, split_id, created_at, blob, ip_hash)
						      SELECT ?, id, ?, ?, ? FROM splits WHERE id = ? AND payments < ? AND expires_at > ?`,
						args: [randomUUID(), now, blob, ipHash, id, MAX_PAYMENTS, now],
					},
					{ sql: "UPDATE splits SET payments = (SELECT COUNT(*) FROM split_payments WHERE split_id = ?) WHERE id = ?", args: [id, id] },
				],
				"write"
			);
			if (inserted.rowsAffected === 0) return reply({ error: "This split is full" }, 409);
			return reply({ ok: true }, 201);
		});
	} catch (err) {
		if (err instanceof FeedbackUnavailableError) return reply({ error: "Offline" }, 503);
		console.error("split payment failed", (err as Error).message);
		return reply({ error: "Couldn't save the payment" }, 500);
	}
}
