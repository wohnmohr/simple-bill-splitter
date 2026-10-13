import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import type { Client } from "@libsql/client";
import { SPLIT_TTL_DAYS } from "@/utils/splitCloud";

/** Splits stop loading and are deleted SPLIT_TTL_DAYS after creation. */
export const SPLIT_TTL_MS = SPLIT_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Deletes expired splits and their payments. Runs alongside normal writes, so
 * storage stays bounded without a scheduled job. Cheap: both deletes use indexes.
 */
export async function purgeExpired(db: Client): Promise<void> {
	const now = Date.now();
	await db.batch(
		[
			{ sql: "DELETE FROM split_payments WHERE split_id IN (SELECT id FROM splits WHERE expires_at <= ?)", args: [now] },
			{ sql: "DELETE FROM splits WHERE expires_at <= ?", args: [now] },
		],
		"write"
	);
}
export const MAX_PAYMENTS = 200;

export const SPLIT_ID_RE = /^[A-Za-z0-9_-]{22}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const BLOB_RE = /^[A-Za-z0-9_-]+$/;

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

export const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
