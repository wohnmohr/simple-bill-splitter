import { FeedbackUnavailableError, hashIp, withDb } from "@/lib/turso";
import { READS_PER_IP_PER_DAY, SPLIT_ID_RE, overLimit, reply } from "@/lib/splitStore";

export const runtime = "nodejs";

/**
 * Returns a split's ciphertext and its payments', oldest first, in one round
 * trip. Polls pass ?v=<payment count they have>; if nothing changed, the
 * payments query matches nothing and only the split row is read.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	if (!SPLIT_ID_RE.test(id)) return reply({ error: "Not found" }, 404);
	const ip = hashIp(req);
	if (overLimit(`read:${ip}`, 60)) return reply({ error: "Slow down" }, 429, { "Retry-After": "30" });
	if (overLimit(`read-day:${ip}`, READS_PER_IP_PER_DAY, 86_400_000)) {
		return reply({ error: "Daily limit reached. Try again tomorrow." }, 429, { "Retry-After": "86400" });
	}
	const v = new URL(req.url).searchParams.get("v");
	const known = v !== null && v !== "" && Number.isSafeInteger(Number(v)) ? Number(v) : null;

	try {
		const [split, payments] = await withDb((db) =>
			db.batch(
				[
					{ sql: "SELECT blob, expires_at, payments FROM splits WHERE id = ? AND expires_at > ?", args: [id, Date.now()] },
					{
						sql: "SELECT blob FROM split_payments WHERE split_id = ? AND (? IS NULL OR ? <> (SELECT payments FROM splits WHERE id = ?)) ORDER BY created_at, id",
						args: [id, known, known, id],
					},
				],
				"read"
			)
		);
		const row = split.rows[0];
		if (!row) return reply({ error: "Not found" }, 404);
		const version = Number(row.payments);
		const expiresAt = Number(row.expires_at);
		if (known === version) return reply({ unchanged: true, version, expiresAt });
		return reply({ blob: row.blob, payments: payments.rows.map((r) => r.blob), version, expiresAt });
	} catch (err) {
		if (err instanceof FeedbackUnavailableError) return reply({ error: "Offline" }, 503);
		console.error("split read failed", (err as Error).message);
		return reply({ error: "Couldn't load the split" }, 500);
	}
}
