import { reply } from "@/lib/splitStore";
import { MAX_OPS_PER_PULL, authorize, groupRoute } from "@/lib/groupStore";

export const runtime = "nodejs";

/**
 * Returns what a device is missing: everything after `after`. If that reaches
 * back past the latest snapshot, the snapshot comes first. A device that is
 * up to date gets a one-row answer.
 */
export const POST = groupRoute({ key: "g-pull", perMinute: 120, maxBody: 1024 }, async ({ db, body, id, token }) => {
	// -1 (or missing) = "I have nothing yet": always behind the first snapshot, which is numbered 0.
	const after = Number.isSafeInteger(body.after) && (body.after as number) >= -1 ? (body.after as number) : -1;
	const group = await authorize(db, id, token);
	if (!group.ok) return group.error;
	const { head, snapshotSeq, expiresAt } = group;
	if (after >= head && after >= snapshotSeq) return reply({ unchanged: true, seq: head, snapshotSeq, expiresAt });

	const needSnapshot = after < snapshotSeq;
	const from = needSnapshot ? snapshotSeq : after;
	const [snap, ops] = await db.batch(
		[
			needSnapshot
				? { sql: "SELECT snapshot, snapshot_seq FROM groups WHERE id = ?", args: [id] }
				: { sql: "SELECT NULL AS snapshot, 0 AS snapshot_seq", args: [] },
			{ sql: "SELECT seq, blob FROM group_ops WHERE group_id = ? AND seq > ? ORDER BY seq LIMIT ?", args: [id, from, MAX_OPS_PER_PULL] },
		],
		"read"
	);
	// Read in one transaction, so the snapshot and the changes after it line up.
	const rows = ops.rows.map((r) => ({ seq: Number(r.seq), blob: String(r.blob) }));
	const snapshot = needSnapshot && snap.rows[0]?.snapshot ? { seq: Number(snap.rows[0].snapshot_seq), blob: String(snap.rows[0].snapshot) } : undefined;
	const reached = rows.length ? rows[rows.length - 1].seq : (snapshot?.seq ?? after);
	return reply({ seq: reached, head, snapshotSeq, more: reached < head, expiresAt, ...(snapshot ? { snapshot } : {}), ops: rows });
});
