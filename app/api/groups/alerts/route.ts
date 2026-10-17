import { reply } from "@/lib/splitStore";
import { authorize, groupRoute } from "@/lib/groupStore";
import { MAX_ALERT_DEVICES, alertsConfigured, cleanSubscription, endpointHash } from "@/lib/groupPush";

export const runtime = "nodejs";

/**
 * Turns alerts for one synced group on or off for one device. Only someone
 * holding the group's token can, so a stranger can't sign up to watch a group.
 */
export const POST = groupRoute({ key: "g-alerts", perMinute: 20, maxBody: 4096 }, async ({ db, body, id, token }) => {
	if (!alertsConfigured) return reply({ error: "Alerts aren't set up" }, 503);
	const sub = cleanSubscription(body.sub);
	if (!sub) return reply({ error: "Invalid subscription" }, 400);
	const group = await authorize(db, id, token);
	if (!group.ok) return group.error;
	const hash = endpointHash(sub.endpoint);
	if (body.on !== true) {
		await db.execute({ sql: "DELETE FROM group_push WHERE group_id = ? AND endpoint_hash = ?", args: [id, hash] });
		return reply({ ok: true, on: false });
	}
	const added = await db.execute({
		sql: `INSERT INTO group_push (group_id, endpoint_hash, sub) SELECT ?, ?, ?
		      WHERE (SELECT COUNT(*) FROM group_push WHERE group_id = ?) < ?
		      ON CONFLICT (group_id, endpoint_hash) DO UPDATE SET sub = excluded.sub`,
		args: [id, hash, JSON.stringify(sub), id, MAX_ALERT_DEVICES],
	});
	if (!added.rowsAffected) return reply({ error: "Too many devices have alerts on for this group" }, 409);
	return reply({ ok: true, on: true });
});
