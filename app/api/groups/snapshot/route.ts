import { reply } from "@/lib/splitStore";
import { GROUP_TTL_MS, MAX_SNAPSHOT_BLOB, authorize, cleanGroupBlob, groupRoute } from "@/lib/groupStore";

export const runtime = "nodejs";

/**
 * Replaces the changes up to `upTo` with one encrypted snapshot of the group
 * at that point, so new devices download one blob instead of the full history.
 */
export const POST = groupRoute({ key: "g-snap", perMinute: 10, maxBody: MAX_SNAPSHOT_BLOB + 1024 }, async ({ db, body, id, token }) => {
	const blob = cleanGroupBlob(body.blob, "snapshot");
	const upTo = Number.isSafeInteger(body.upTo) && (body.upTo as number) > 0 ? (body.upTo as number) : null;
	if (!blob || !upTo) return reply({ error: "Invalid snapshot" }, 400);
	const group = await authorize(db, id, token);
	if (!group.ok) return group.error;
	if (upTo > group.head) return reply({ error: "Ahead of the group" }, 409);
	if (upTo <= group.snapshotSeq) return reply({ ok: true, seq: group.snapshotSeq });
	const [updated] = await db.batch(
		[
			{
				sql: "UPDATE groups SET snapshot = ?, snapshot_seq = ?, expires_at = ? WHERE id = ? AND snapshot_seq < ? AND head_seq >= ?",
				args: [blob, upTo, Date.now() + GROUP_TTL_MS, id, upTo, upTo],
			},
			{ sql: "DELETE FROM group_ops WHERE group_id = ? AND seq <= (SELECT snapshot_seq FROM groups WHERE id = ?)", args: [id, id] },
		],
		"write"
	);
	return reply({ ok: true, seq: updated.rowsAffected ? upTo : group.snapshotSeq });
});
