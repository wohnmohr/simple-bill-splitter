import { randomUUID } from "crypto";
import {
	FeedbackUnavailableError,
	cleanContext,
	cleanText,
	ensureSchema,
	getDb,
	hashIp,
	isEmail,
	isRateLimited,
} from "@/lib/turso";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

	const title = cleanText(body.title, 120);
	const details = cleanText(body.details, 4000);
	const email = cleanText(body.email, 254)?.toLowerCase() ?? "";

	if (!title || title.length < 4) {
		return Response.json({ error: "Describe the feature in a few words." }, { status: 400 });
	}
	if (!isEmail(email)) {
		return Response.json(
			{ error: "Add an email we can reach you at, like you@example.com." },
			{ status: 400 }
		);
	}

	try {
		const db = getDb();
		await ensureSchema(db);
		const ipHash = hashIp(req);
		if (await isRateLimited(db, "feature_requests", ipHash, 5)) {
			return Response.json(
				{ error: "You've sent several requests this hour — we'll read those first." },
				{ status: 429 }
			);
		}
		await db.execute({
			sql: `INSERT INTO feature_requests (id, created_at, title, details, email, context, ip_hash)
			      VALUES (?, ?, ?, ?, ?, ?, ?)`,
			args: [randomUUID(), Date.now(), title, details, email, cleanContext(body.context), ipHash],
		});
		return Response.json({ ok: true });
	} catch (err) {
		if (err instanceof FeedbackUnavailableError) {
			return Response.json({ error: "Requests are offline right now." }, { status: 503 });
		}
		console.error("feature request insert failed", (err as Error).message);
		return Response.json({ error: "Couldn't send your request. Try again." }, { status: 500 });
	}
}
