import { reply } from "@/lib/splitStore";
import { MAX_OPS_PER_PULL, checkAuth, fitPull, groupRoute, selectGroup } from "@/lib/groupStore";

export const runtime = "nodejs";

/**
 * Returns what a device is missing: everything after `after`. If that reaches
 * back past the latest snapshot, the snapshot comes first. One round trip
 * either way; a device that is up to date reads one row and two empty ranges.
 * A big backlog comes in pages (`more`), so no response outgrows the host's limit.
 */
export const POST = groupRoute({ key: "g-pull", perMinute: 120, maxBody: 1024 }, async ({ db, body, id, token }) => {
	// -1 (or missing) = "I have nothing yet": always behind the first snapshot, which is numbered 0.
	const after = Number.isSafeInteger(body.after) && (body.after as number) >= -1 ? (body.after as number) : -1;
	// Read in one transaction, so the head, the snapshot and the changes after it line up.
	const [row, snap, ops] = await db.batch(
		[
			selectGroup(id),
			{ sql: "SELECT snapshot, snapshot_seq FROM groups WHERE id = ? AND snapshot_seq > ?", args: [id, after] },
			{
				sql: "SELECT seq, blob FROM group_ops WHERE group_id = ? AND seq > MAX(?, (SELECT snapshot_seq FROM groups WHERE id = ?)) ORDER BY seq LIMIT ?",
				args: [id, after, id, MAX_OPS_PER_PULL],
			},
		],
		"read"
	);
	// Nothing read above leaves the server unless the token matches.
	const group = await checkAuth(db, id, row.rows[0], token);
	if (!group.ok) return group.error;
	const { head, snapshotSeq, expiresAt } = group;
	if (after >= head && after >= snapshotSeq) return reply({ unchanged: true, seq: head, snapshotSeq, expiresAt });

	const snapshot = snap.rows[0]?.snapshot ? { seq: Number(snap.rows[0].snapshot_seq), blob: String(snap.rows[0].snapshot) } : undefined;
	const rows = fitPull(ops.rows.map((r) => ({ seq: Number(r.seq), blob: String(r.blob) })), snapshot?.blob.length ?? 0);
	const reached = rows.length ? rows[rows.length - 1].seq : (snapshot?.seq ?? after);
	return reply({ seq: reached, head, snapshotSeq, more: reached < head, expiresAt, ...(snapshot ? { snapshot } : {}), ops: rows });
});
