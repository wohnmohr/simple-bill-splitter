import { randomUUID } from "crypto";
import {
	FeedbackUnavailableError,
	cleanContext,
	cleanText,
	hashIp,
	rateLimitHit,
	withDb,
} from "@/lib/turso";

import { sameOrigin } from "@/lib/splitStore";

export const runtime = "nodejs";

const TRIGGERS = new Set(["group_settled", "manual", "share_viewed", "moment"]);

export async function POST(req: Request) {
	if (!sameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return Response.json({ error: "Invalid request" }, { status: 400 });
	}

	// Honeypot: real people never see or fill this field.
	if (typeof body.website === "string" && body.website.length > 0) {
		return Response.json({ ok: true });
	}

	const rating = Number(body.rating);
	if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
		return Response.json({ error: "Pick a rating from 1 to 5." }, { status: 400 });
	}
	const comment = cleanText(body.comment, 2000);
	const trigger = typeof body.trigger === "string" && TRIGGERS.has(body.trigger)
		? body.trigger
		: "manual";

	try {
		return await withDb(async (db) => {
			const ipHash = hashIp(req);
			const hit = await rateLimitHit(db, "feedback", ipHash);
			if (hit) {
				return Response.json(
					{ error: `Thanks — we've got plenty from you ${hit === "day" ? "today" : "this hour"}. Try again later.` },
					{ status: 429, headers: { "Retry-After": hit === "day" ? "86400" : "3600" } }
				);
			}
			await db.execute({
				sql: `INSERT INTO feedback (id, created_at, rating, comment, trigger, context, ip_hash)
				      VALUES (?, ?, ?, ?, ?, ?, ?)`,
				args: [randomUUID(), Date.now(), rating, comment, trigger, cleanContext(body.context), ipHash],
			});
			return Response.json({ ok: true });
		});
	} catch (err) {
		if (err instanceof FeedbackUnavailableError) {
			return Response.json({ error: "Feedback is offline right now." }, { status: 503 });
		}
		console.error("feedback insert failed", (err as Error).message);
		return Response.json({ error: "Couldn't save your feedback. Try again." }, { status: 500 });
	}
}
