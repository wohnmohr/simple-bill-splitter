import { hashToken, reply } from "@/lib/splitStore";
import { GROUP_TTL_MS, MAX_SNAPSHOT_BLOB, cleanGroupBlob, groupRoute, purgeExpiredGroups, quotaNewGroup } from "@/lib/groupStore";

export const runtime = "nodejs";

/** Creates a synced group from its first encrypted snapshot. */
export const POST = groupRoute({ key: "g-new", perMinute: 10, maxBody: MAX_SNAPSHOT_BLOB + 1024 }, async ({ db, body, ip, id, token }) => {
	const blob = cleanGroupBlob(body.blob, "snapshot");
	if (!blob) return reply({ error: "Invalid group" }, 400);
	if (!(await quotaNewGroup(db, ip))) return reply({ error: "Too many new groups today. Try again tomorrow." }, 429, { "Retry-After": "86400" });
	const expiresAt = Date.now() + GROUP_TTL_MS;
	const res = await db.execute({
		sql: "INSERT INTO groups (id, auth_hash, expires_at, snapshot) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
		args: [id, hashToken(token), expiresAt, blob],
	});
	if (res.rowsAffected === 0) return reply({ error: "Group already exists" }, 409);
	await purgeExpiredGroups(db).catch((e) => console.error("group purge failed", (e as Error).message));
	return reply({ ok: true, seq: 0, expiresAt }, 201);
});
