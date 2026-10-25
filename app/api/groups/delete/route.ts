import { reply } from "@/lib/splitStore";
import { authorize, deleteGroup, groupRoute } from "@/lib/groupStore";

export const runtime = "nodejs";

/** Deletes a group and all its ciphertext for everyone. Also how a link is reset. */
export const POST = groupRoute({ key: "g-del", perMinute: 10, maxBody: 1024 }, async ({ db, id, token }) => {
	const group = await authorize(db, id, token);
	if (!group.ok) return group.error;
	await deleteGroup(db, id);
	return reply({ ok: true });
});
