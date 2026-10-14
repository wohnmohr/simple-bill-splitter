import { reply } from "@/lib/splitStore";
import { GROUP_TTL_MS, MAX_OPS_BLOB, MAX_UNCOMPACTED, authorize, cleanGroupBlob, groupRoute, quotaPush } from "@/lib/groupStore";

export const runtime = "nodejs";

/** Appends one encrypted batch of changes and returns its sequence number. */
export const POST = groupRoute({ key: "g-push", perMinute: 60, maxBody: MAX_OPS_BLOB + 1024 }, async ({ db, body, ip, id, token }) => {
	const blob = cleanGroupBlob(body.blob, "ops");
	if (!blob) return reply({ error: "Invalid changes" }, 400);
	const group = await authorize(db, id, token);
	if (!group.ok) return group.error;
	if (group.head - group.snapshotSeq >= MAX_UNCOMPACTED) return reply({ error: "Compact first", compact: true }, 409);
	if (!(await quotaPush(db, ip))) return reply({ error: "Too many changes today. Try again tomorrow." }, 429, { "Retry-After": "86400" });
	const now = Date.now();
	// One transaction: take the next number, store the batch, move the head.
	// Parallel pushes queue behind each other, so none is lost or numbered twice,
	// and a reader never sees the head ahead of the rows.
	const [inserted, head] = await db.batch(
		[
			{
				sql: "INSERT INTO group_ops (group_id, seq, blob) SELECT id, head_seq + 1, ? FROM groups WHERE id = ? AND expires_at > ?",
				args: [blob, id, now],
			},
			{ sql: "UPDATE groups SET head_seq = head_seq + 1, expires_at = ? WHERE id = ? AND changes() = 1 RETURNING head_seq", args: [now + GROUP_TTL_MS, id] },
		],
		"write"
	);
	if (inserted.rowsAffected === 0 || !head.rows[0]) return reply({ error: "Not found" }, 404);
	return reply({ ok: true, seq: Number(head.rows[0].head_seq) }, 201);
});
