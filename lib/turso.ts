import "server-only";
import { createClient, type Client, type InStatement } from "@libsql/client";
import { createHash } from "crypto";
import { after } from "next/server";

/**
 * Turso holds feedback, feature requests, and end-to-end encrypted split links
 * and synced groups. Groups stay on the user's device unless they turn on sync.
 * Split and group rows are ciphertext sealed in the browser; the key stays in
 * the link's #fragment, so the server cannot read names, amounts or UPI IDs.
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
	// Messages from the contact page; the email is only for replying.
	`CREATE TABLE IF NOT EXISTS contact_messages (
		id          TEXT PRIMARY KEY,
		created_at  INTEGER NOT NULL,
		topic       TEXT NOT NULL,
		message     TEXT NOT NULL,
		email       TEXT NOT NULL,
		status      TEXT NOT NULL DEFAULT 'new',
		ip_hash     TEXT NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS contact_messages_created ON contact_messages (created_at)`,
	`CREATE INDEX IF NOT EXISTS contact_messages_ip ON contact_messages (ip_hash, created_at)`,
	`CREATE TABLE IF NOT EXISTS splits (
		id          TEXT PRIMARY KEY,
		created_at  INTEGER NOT NULL,
		expires_at  INTEGER NOT NULL,
		write_hash  TEXT NOT NULL,
		blob        TEXT NOT NULL,
		ip_hash     TEXT NOT NULL,
		payments    INTEGER NOT NULL DEFAULT 0
	)`,
	`CREATE INDEX IF NOT EXISTS splits_ip ON splits (ip_hash, created_at)`,
	`CREATE INDEX IF NOT EXISTS splits_expiry ON splits (expires_at)`,
	`CREATE TABLE IF NOT EXISTS split_payments (
		id          TEXT PRIMARY KEY,
		split_id    TEXT NOT NULL REFERENCES splits (id) ON DELETE CASCADE,
		created_at  INTEGER NOT NULL,
		blob        TEXT NOT NULL,
		ip_hash     TEXT NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS split_payments_split ON split_payments (split_id, created_at)`,
	`CREATE INDEX IF NOT EXISTS split_payments_ip ON split_payments (ip_hash, created_at)`,
	// Synced groups. The server holds ciphertext, a hash of the write token and an
	// expiry, and nothing else: no names, no creation time, no IP. The id is
	// derived one-way from the link secret, so it can't be turned back into a key.
	`CREATE TABLE IF NOT EXISTS groups (
		id            TEXT PRIMARY KEY,
		auth_hash     TEXT NOT NULL,
		expires_at    INTEGER NOT NULL,
		head_seq      INTEGER NOT NULL DEFAULT 0,
		snapshot_seq  INTEGER NOT NULL DEFAULT 0,
		snapshot      TEXT NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS groups_expiry ON groups (expires_at)`,
	// Encrypted batches of changes since the last snapshot, in server order.
	`CREATE TABLE IF NOT EXISTS group_ops (
		group_id  TEXT NOT NULL,
		seq       INTEGER NOT NULL,
		blob      TEXT NOT NULL,
		PRIMARY KEY (group_id, seq)
	)`,
	// Global counters per hour and per day ("h:<hour>", "d:<day>"): ceilings on new
	// splits whatever IPs they come from.
	`CREATE TABLE IF NOT EXISTS api_quota (
		bucket  TEXT PRIMARY KEY,
		at      INTEGER NOT NULL,
		n       INTEGER NOT NULL
	)`,
];

/** Columns added after a table first shipped; "duplicate column" means it's already there. */
const MIGRATIONS = ["ALTER TABLE splits ADD COLUMN payments INTEGER NOT NULL DEFAULT 0"];

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

function ensureSchema(db: Client): Promise<void> {
	if (!schemaReady) {
		schemaReady = db
			.batch(SCHEMA, "write")
			.then(async () => {
				for (const sql of MIGRATIONS) await db.execute(sql).catch(() => undefined);
			})
			.catch((err) => {
				schemaReady = null;
				throw err;
			});
	}
	return schemaReady;
}

const MISSING_SCHEMA = /no such (table|column)/i;

/**
 * Runs `fn` against the database without waiting for schema setup, which
 * would otherwise cost every new server instance a write transaction before
 * its first answer. The schema is brought up to date once per instance after
 * the response is sent; on a brand-new database, where a table or column is
 * missing, it's created on the spot and `fn` runs once more.
 */
export async function withDb<T>(fn: (db: Client) => Promise<T>): Promise<T> {
	const db = getDb();
	if (!schemaReady) after(() => ensureSchema(db).catch((e) => console.error("schema update failed", (e as Error).message)));
	try {
		return await fn(db);
	} catch (err) {
		if (!MISSING_SCHEMA.test((err as Error)?.message ?? "")) throw err;
		await ensureSchema(db);
		return fn(db);
	}
}

/** Salted hash of the caller's IP: enough to rate-limit, not enough to identify. */
export function hashIp(req: Request): string {
	// Vercel sets these at its edge and overwrites anything the client sends,
	// so they can't be spoofed to dodge rate limits.
	const ip =
		req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
		req.headers.get("x-real-ip") ||
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		"unknown";
	const salt = process.env.FEEDBACK_IP_SALT || "splitbiller-dev-salt";
	return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export type RateTable = "feedback" | "feature_requests" | "contact_messages" | "splits" | "split_payments";

/** Per-IP write budgets: a short burst window and a daily cap, so one source can't flood us all day. */
export const WRITE_LIMITS: Record<RateTable, { hour: number; day: number }> = {
	splits: { hour: 30, day: 100 },
	split_payments: { hour: 60, day: 300 },
	feedback: { hour: 10, day: 30 },
	feature_requests: { hour: 5, day: 15 },
	contact_messages: { hour: 5, day: 15 },
};

/** Counts this IP's writes to `table` in the last day and hour; one indexed read. Batch it with other reads. */
export function rateLimitQuery(table: RateTable, ipHash: string): InStatement {
	const now = Date.now();
	return {
		sql: `SELECT COUNT(*) AS day, COALESCE(SUM(created_at > ?), 0) AS hour FROM ${table} WHERE ip_hash = ? AND created_at > ?`,
		args: [now - 3_600_000, ipHash, now - 86_400_000],
	};
}

/** Which window the counts from rateLimitQuery have used up, or null if the IP may write. */
export function rateLimitVerdict(table: RateTable, row: Record<string, unknown> | undefined): "hour" | "day" | null {
	const { hour, day } = WRITE_LIMITS[table];
	if (Number(row?.day ?? 0) >= day) return "day";
	if (Number(row?.hour ?? 0) >= hour) return "hour";
	return null;
}

/** Which window this IP has used up in `table`, or null if it may write. */
export async function rateLimitHit(db: Client, table: RateTable, ipHash: string): Promise<"hour" | "day" | null> {
	const res = await db.execute(rateLimitQuery(table, ipHash));
	return rateLimitVerdict(table, res.rows[0]);
}

/** A 429 that says when to come back. */
export function rateLimited(window: "hour" | "day", what: string): Response {
	const retry = window === "day" ? 86_400 : 3_600;
	return Response.json(
		{ error: `You've reached today's limit for ${what}. Try again ${window === "day" ? "tomorrow" : "in an hour"}.` },
		{ status: 429, headers: { "Retry-After": String(retry), "Cache-Control": "no-store" } }
	);
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
