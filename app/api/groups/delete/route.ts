import { reply } from "@/lib/splitStore";
import { authorize, groupRoute } from "@/lib/groupStore";

export const runtime = "nodejs";

/** Deletes a group and all its ciphertext for everyone. Also how a link is reset. */
export const POST = groupRoute({ key: "g-del", perMinute: 10, maxBody: 1024 }, async ({ db, id, token }) => {
	const group = await authorize(db, id, token);
	if (!group.ok) return group.error;
	await db.batch(
		[
			{ sql: "DELETE FROM group_ops WHERE group_id = ?", args: [id] },
			{ sql: "DELETE FROM groups WHERE id = ?", args: [id] },
		],
		"write"
	);
	return reply({ ok: true });
});
