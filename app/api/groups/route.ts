import { after } from "next/server";
import { reply } from "@/lib/splitStore";
import { GROUP_TTL_MS, MAX_SNAPSHOT_BLOB, cleanGroupBlob, groupRoute, insertGroup, purgeExpiredGroups } from "@/lib/groupStore";

export const runtime = "nodejs";

/** Creates a synced group from its first encrypted snapshot. */
export const POST = groupRoute({ key: "g-new", perMinute: 10, maxBody: MAX_SNAPSHOT_BLOB + 1024 }, async ({ db, body, ip, id, token }) => {
	const blob = cleanGroupBlob(body.blob, "snapshot");
	if (!blob) return reply({ error: "Invalid group" }, 400);
	const expiresAt = Date.now() + GROUP_TTL_MS;
	const result = await insertGroup(db, { ip, id, token, blob, expiresAt });
	if (result === "quota") return reply({ error: "Too many new groups today. Try again tomorrow." }, 429, { "Retry-After": "86400" });
	if (result === "exists") return reply({ error: "Group already exists" }, 409);
	// Housekeeping runs after the response, so it never slows the person down.
	after(() => purgeExpiredGroups(db).catch((e) => console.error("group purge failed", (e as Error).message)));
	return reply({ ok: true, seq: 0, expiresAt }, 201);
});
