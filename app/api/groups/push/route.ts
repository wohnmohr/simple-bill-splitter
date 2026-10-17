import { after } from "next/server";
import { reply } from "@/lib/splitStore";
import { MAX_OPS_BLOB, appendOps, cleanGroupBlob, groupRoute } from "@/lib/groupStore";
import { ENDPOINT_HASH_RE, alertGroup } from "@/lib/groupPush";

export const runtime = "nodejs";

/** Appends one encrypted batch of changes and returns its sequence number, then alerts the group's other devices. */
export const POST = groupRoute({ key: "g-push", perMinute: 60, maxBody: MAX_OPS_BLOB + 1024 }, async ({ db, body, ip, id, token }) => {
	const blob = cleanGroupBlob(body.blob, "ops");
	if (!blob) return reply({ error: "Invalid changes" }, 400);
	const res = await appendOps(db, { ip, id, token, blob });
	// The device that made the change says which push address is its own, so it isn't alerted.
	const quiet = typeof body.quiet === "string" && ENDPOINT_HASH_RE.test(body.quiet) ? body.quiet : null;
	if (res.status === 201) after(() => alertGroup(db, id, quiet).catch((e) => console.error("group alert failed", (e as Error).message)));
	return res;
});
