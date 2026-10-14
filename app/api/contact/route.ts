import { randomUUID } from "crypto";
import { FeedbackUnavailableError, cleanText, hashIp, isEmail, rateLimitHit, withDb } from "@/lib/turso";
import { sameOrigin } from "@/lib/splitStore";
import { isContactTopic } from "@/content/contact";

export const runtime = "nodejs";

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

	const topic = isContactTopic(body.topic) ? body.topic : "other";
	const message = cleanText(body.message, 4000);
	const email = cleanText(body.email, 254)?.toLowerCase() ?? "";

	if (!message || message.length < 10) {
		return Response.json({ error: "Tell us a little more, a sentence or two." }, { status: 400 });
	}
	if (!isEmail(email)) {
		return Response.json({ error: "Add an email we can reply to, like you@example.com." }, { status: 400 });
	}

	try {
		return await withDb(async (db) => {
			const ipHash = hashIp(req);
			const hit = await rateLimitHit(db, "contact_messages", ipHash);
			if (hit) {
				return Response.json(
					{ error: `You've sent several messages ${hit === "day" ? "today" : "this hour"}. We'll reply to those first.` },
					{ status: 429, headers: { "Retry-After": hit === "day" ? "86400" : "3600" } }
				);
			}
			await db.execute({
				sql: `INSERT INTO contact_messages (id, created_at, topic, message, email, ip_hash) VALUES (?, ?, ?, ?, ?, ?)`,
				args: [randomUUID(), Date.now(), topic, message, email, ipHash],
			});
			return Response.json({ ok: true });
		});
	} catch (err) {
		if (err instanceof FeedbackUnavailableError) {
			return Response.json({ error: "Messages are offline right now." }, { status: 503 });
		}
		console.error("contact message insert failed", (err as Error).message);
		return Response.json({ error: "Couldn't send your message. Try again." }, { status: 500 });
	}
}
