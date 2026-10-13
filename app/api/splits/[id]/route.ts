import { FeedbackUnavailableError, ensureSchema, getDb } from "@/lib/turso";
import { NO_STORE, SPLIT_ID_RE } from "@/lib/splitStore";

export const runtime = "nodejs";

/** Returns a split's ciphertext and its payments' ciphertexts, oldest first. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	if (!SPLIT_ID_RE.test(id)) return Response.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
	try {
		const db = getDb();
		await ensureSchema(db);
		const split = await db.execute({ sql: "SELECT blob, expires_at FROM splits WHERE id = ? AND expires_at > ?", args: [id, Date.now()] });
		if (!split.rows.length) return Response.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
		const payments = await db.execute({ sql: "SELECT blob FROM split_payments WHERE split_id = ? ORDER BY created_at, id", args: [id] });
		return Response.json(
			{ blob: split.rows[0].blob, payments: payments.rows.map((r) => r.blob), expiresAt: Number(split.rows[0].expires_at) },
			{ headers: NO_STORE }
		);
	} catch (err) {
		if (err instanceof FeedbackUnavailableError) return Response.json({ error: "Offline" }, { status: 503, headers: NO_STORE });
		console.error("split read failed", (err as Error).message);
		return Response.json({ error: "Couldn't load the split" }, { status: 500, headers: NO_STORE });
	}
}
