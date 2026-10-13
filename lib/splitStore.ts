import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import type { Client } from "@libsql/client";
import { SPLIT_TTL_DAYS } from "@/utils/splitCloud";

/**
 * Guard rails for the encrypted split store. The server can't read what it
 * stores, so abuse is bounded by shape and volume instead of content:
 * small fixed-format bodies, same-origin writes, per-IP and global quotas,
 * an atomic per-split payment cap, and data that deletes itself.
 */

/** Splits stop loading and are deleted SPLIT_TTL_DAYS after creation. */
export const SPLIT_TTL_MS = SPLIT_TTL_DAYS * 24 * 60 * 60 * 1000;
export const MAX_PAYMENTS = 200;
/** Requests larger than this are refused before parsing. Real ones are under 2 KB. */
const MAX_BODY_BYTES = 8 * 1024;
/** Ceiling on new splits per hour across everyone; beyond it, the app falls back to link-only splits. */
const GLOBAL_SPLITS_PER_HOUR = Number(process.env.SPLITS_PER_HOUR_MAX) || 1000;

export const SPLIT_ID_RE = /^[A-Za-z0-9_-]{22}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const BLOB_RE = /^[A-Za-z0-9_-]+$/;

export const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export const reply = (body: unknown, status = 200, extra?: Record<string, string>) =>
	Response.json(body, { status, headers: { ...NO_STORE, ...extra } });

/** A base64url ciphertext no longer than `max` characters, or null. */
export const cleanBlob = (v: unknown, max: number) =>
	typeof v === "string" && v.length >= 40 && v.length <= max && BLOB_RE.test(v) ? v : null;

export const cleanToken = (v: unknown) => (typeof v === "string" && TOKEN_RE.test(v) ? v : null);

/** We store only a hash of the write token, never the token itself. */
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const tokenMatches = (token: string, storedHash: string) => {
	const a = Buffer.from(hashToken(token), "hex");
	const b = Buffer.from(storedHash, "hex");
	return a.length === b.length && timingSafeEqual(a, b);
};

/** Parses a small JSON object body; null if it's too big, not JSON, or not an object. */
export async function readSmallJson(req: Request): Promise<Record<string, unknown> | null> {
	const declared = Number(req.headers.get("content-length") || 0);
	if (declared > MAX_BODY_BYTES) return null;
	try {
		const text = await req.text();
		if (text.length > MAX_BODY_BYTES) return null;
		const body = JSON.parse(text);
		return body && typeof body === "object" && !Array.isArray(body) ? body : null;
	} catch {
		return null;
	}
}

/** Writes must come from our own pages (browsers always send Origin on cross-site POSTs). */
export function sameOrigin(req: Request): boolean {
	const origin = req.headers.get("origin");
	if (!origin) return true; // non-browser clients; still bound by every other limit
	try {
		return new URL(origin).host === req.headers.get("host");
	} catch {
		return false;
	}
}

// ── Fast, per-instance limiter ────────────────────────────────
// Catches bursts before they cost a database round trip. Each serverless
// instance keeps its own counts; the database quotas below are the hard limit.

const buckets = new Map<string, { n: number; reset: number }>();

/** True if `key` has used up `limit` requests in the current window. */
export function overLimit(key: string, limit: number, windowMs = 60_000): boolean {
	const now = Date.now();
	if (buckets.size > 10_000) {
		for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
	}
	const b = buckets.get(key);
	if (!b || b.reset <= now) {
		buckets.set(key, { n: 1, reset: now + windowMs });
		return false;
	}
	b.n++;
	return b.n > limit;
}

/** Takes one slot from this hour's global quota; false when the hour is full. */
export async function takeGlobalSlot(db: Client): Promise<boolean> {
	const hour = Math.floor(Date.now() / 3_600_000);
	const res = await db.execute({
		sql: "INSERT INTO split_quota (hour, n) VALUES (?, 1) ON CONFLICT (hour) DO UPDATE SET n = n + 1 RETURNING n",
		args: [hour],
	});
	return Number(res.rows[0]?.n ?? 0) <= GLOBAL_SPLITS_PER_HOUR;
}

/**
 * Deletes expired splits, their payments and old quota rows. Runs alongside
 * new splits, so storage stays bounded without a scheduled job.
 */
export async function purgeExpired(db: Client): Promise<void> {
	const now = Date.now();
	await db.batch(
		[
			{ sql: "DELETE FROM split_payments WHERE split_id IN (SELECT id FROM splits WHERE expires_at <= ?)", args: [now] },
			{ sql: "DELETE FROM splits WHERE expires_at <= ?", args: [now] },
			{ sql: "DELETE FROM split_quota WHERE hour < ?", args: [Math.floor(now / 3_600_000) - 24] },
		],
		"write"
	);
}
