import "server-only";
import { createClient, type Client } from "@libsql/client";
import { createHash } from "crypto";

/**
 * Turso holds feedback and feature requests only — never groups, expenses,
 * names or UPI IDs. Those stay on the user's device.
 */

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

const SCHEMA = [
	`CREATE TABLE IF NOT EXISTS feedback (
		id          TEXT PRIMARY KEY,
		created_at  INTEGER NOT NULL,
		rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
		comment     TEXT,
		trigger     TEXT NOT NULL,
		context     TEXT NOT NULL,
		ip_hash     TEXT NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS feedback_created ON feedback (created_at)`,
	`CREATE INDEX IF NOT EXISTS feedback_ip ON feedback (ip_hash, created_at)`,
	`CREATE TABLE IF NOT EXISTS feature_requests (
		id          TEXT PRIMARY KEY,
		created_at  INTEGER NOT NULL,
		title       TEXT NOT NULL,
		details     TEXT,
		email       TEXT NOT NULL,
		context     TEXT NOT NULL,
		status      TEXT NOT NULL DEFAULT 'new',
		ip_hash     TEXT NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS feature_requests_created ON feature_requests (created_at)`,
	`CREATE INDEX IF NOT EXISTS feature_requests_ip ON feature_requests (ip_hash, created_at)`,
];

export class FeedbackUnavailableError extends Error {}

/** Returns a libSQL client, or throws when no database is configured. */
export function getDb(): Client {
	if (client) return client;

	const url = process.env.TURSO_DATABASE_URL;
	const authToken = process.env.TURSO_AUTH_TOKEN;

	if (url) {
		client = createClient({ url, authToken });
	} else if (process.env.NODE_ENV !== "production") {
		// Local development without Turso credentials: a SQLite file on disk.
		client = createClient({ url: "file:.turso-dev.db" });
	} else {
		throw new FeedbackUnavailableError("TURSO_DATABASE_URL is not set");
	}
	return client;
}

export async function ensureSchema(db: Client): Promise<void> {
	if (!schemaReady) {
		schemaReady = db
			.batch(SCHEMA, "write")
			.then(() => undefined)
			.catch((err) => {
				schemaReady = null;
				throw err;
			});
	}
	return schemaReady;
}

/** Salted hash of the caller's IP: enough to rate-limit, not enough to identify. */
export function hashIp(req: Request): string {
	const ip =
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		req.headers.get("x-real-ip") ||
		"unknown";
	const salt = process.env.FEEDBACK_IP_SALT || "splitbiller-dev-salt";
	return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** True when this IP has already submitted `max` rows to `table` in the last hour. */
export async function isRateLimited(
	db: Client,
	table: "feedback" | "feature_requests",
	ipHash: string,
	max: number
): Promise<boolean> {
	const since = Date.now() - 60 * 60 * 1000;
	const res = await db.execute({
		sql: `SELECT COUNT(*) AS n FROM ${table} WHERE ip_hash = ? AND created_at > ?`,
		args: [ipHash, since],
	});
	return Number(res.rows[0]?.n ?? 0) >= max;
}

// ── Input hygiene ─────────────────────────────────────────────

export const cleanText = (value: unknown, max: number): string | null => {
	if (typeof value !== "string") return null;
	const trimmed = value.replace(/\u0000/g, "").trim();
	return trimmed ? trimmed.slice(0, max) : null;
};

export const isEmail = (value: string) =>
	value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const CONTEXT_MAX_BYTES = 4000;

/**
 * Keeps only flat, primitive context values (strings/numbers/booleans) and
 * short event breadcrumbs. Anything else from the client is dropped.
 */
export function cleanContext(raw: unknown): string {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "{}";
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(raw as Record<string, unknown>).slice(0, 40)) {
		if (!/^[a-zA-Z_]{1,40}$/.test(key)) continue;
		if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
		else if (typeof value === "boolean") out[key] = value;
		else if (typeof value === "string") out[key] = value.slice(0, 200);
		else if (key === "recent_actions" && Array.isArray(value)) {
			out[key] = value
				.filter((v): v is string => typeof v === "string")
				.slice(-15)
				.map((v) => v.slice(0, 80));
		}
	}
	const json = JSON.stringify(out);
	return json.length > CONTEXT_MAX_BYTES ? "{}" : json;
}
