import { reply } from "@/lib/splitStore";
import { MAX_OPS_BLOB, appendOps, cleanGroupBlob, groupRoute } from "@/lib/groupStore";

export const runtime = "nodejs";

/** Appends one encrypted batch of changes and returns its sequence number. */
export const POST = groupRoute({ key: "g-push", perMinute: 60, maxBody: MAX_OPS_BLOB + 1024 }, async ({ db, body, ip, id, token }) => {
	const blob = cleanGroupBlob(body.blob, "ops");
	if (!blob) return reply({ error: "Invalid changes" }, 400);
	return appendOps(db, { ip, id, token, blob });
});
