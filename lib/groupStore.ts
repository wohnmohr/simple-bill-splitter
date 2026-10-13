import "server-only";
import type { Client } from "@libsql/client";
import { FeedbackUnavailableError, ensureSchema, getDb, hashIp } from "@/lib/turso";
import { cleanToken, overLimit, reply, sameOrigin, tokenMatches } from "@/lib/splitStore";

/**
 * Guard rails for synced groups. Like split links, the server can't read what
 * it stores, so abuse is bounded by shape and volume: same-origin writes,
 * size-capped ciphertext, per-IP and global quotas, a cap on uncompacted
 * changes per group, and groups that delete themselves when left alone.
 *
 * Privacy: rows carry no IP, name or creation time. Quotas count by a salted
 * IP hash in api_quota, never next to a group id, and those counters are
 * purged after two days.
 */

/** Groups untouched this long are deleted. Every change pushes it back. */
export const GROUP_TTL_MS = 180 * 24 * 60 * 60 * 1000;
/** Changes kept before a snapshot must fold them in (clients compact well before this). */
export const MAX_UNCOMPACTED = 2000;
const MAX_OPS_PER_PULL = 200;
/** 64 KB padded batch → about 87,500 base64url characters. */
const MAX_OPS_BLOB = 90_000;
/** 512 KB padded snapshot → about 700,000 base64url characters. */
const MAX_SNAPSHOT_BLOB = 720_000;
const BLOB_RE = /^[A-Za-z0-9_-]+$/;
export const GROUP_ID_RE = /^[A-Za-z0-9_-]{22}$/;

const NEW_GROUPS_PER_IP_PER_DAY = 30;
const NEW_GROUPS_PER_DAY = Number(process.env.GROUPS_PER_DAY_MAX) || 5000;
const PUSHES_PER_IP_PER_DAY = 3000;

export const cleanGroupBlob = (v: unknown, kind: "ops" | "snapshot") =>
	typeof v === "string" && v.length >= 40 && v.length <= (kind === "ops" ? MAX_OPS_BLOB : MAX_SNAPSHOT_BLOB) && BLOB_RE.test(v) ? v : null;

/** Parses a JSON object body no larger than `max` bytes; null otherwise. */
async function readJson(req: Request, max: number): Promise<Record<string, unknown> | null> {
	if (Number(req.headers.get("content-length") || 0) > max) return null;
	try {
		const text = await req.text();
		if (text.length > max) return null;
		const body = JSON.parse(text);
		return body && typeof body === "object" && !Array.isArray(body) ? body : null;
	} catch {
		return null;
	}
}

/** Takes one unit from a counter; false once it passes `limit`. */
async function takeQuota(db: Client, bucket: string, limit: number): Promise<boolean> {
	const res = await db.execute({
		sql: "INSERT INTO api_quota (bucket, at, n) VALUES (?, ?, 1) ON CONFLICT (bucket) DO UPDATE SET n = n + 1 RETURNING n",
		args: [bucket, Date.now()],
	});
	return Number(res.rows[0]?.n ?? 0) <= limit;
}

const today = () => Math.floor(Date.now() / 86_400_000);
export const quotaNewGroup = async (db: Client, ip: string) =>
	(await takeQuota(db, `g:new:${ip}:${today()}`, NEW_GROUPS_PER_IP_PER_DAY)) && (await takeQuota(db, `g:new:${today()}`, NEW_GROUPS_PER_DAY));
export const quotaPush = (db: Client, ip: string) => takeQuota(db, `g:push:${ip}:${today()}`, PUSHES_PER_IP_PER_DAY);

/** Deletes groups nobody has changed for GROUP_TTL_MS, with their changes, and stale quota counters. */
export async function purgeExpiredGroups(db: Client): Promise<void> {
	const now = Date.now();
	await db.batch(
		[
			{ sql: "DELETE FROM group_ops WHERE group_id IN (SELECT id FROM groups WHERE expires_at <= ?)", args: [now] },
			{ sql: "DELETE FROM groups WHERE expires_at <= ?", args: [now] },
			{ sql: "DELETE FROM api_quota WHERE at < ?", args: [now - 2 * 86_400_000] },
		],
		"write"
	);
}

type Ctx = { db: Client; body: Record<string, unknown>; ip: string; id: string; token: string };
type Handler = (ctx: Ctx) => Promise<Response>;

/**
 * Shared front door for every group endpoint: same-origin, burst limit, size
 * limit, id and token shape. The group id travels in the body, never the URL,
 * so it stays out of request logs.
 */
export function groupRoute(opts: { maxBody: number; perMinute: number; key: string }, handler: Handler) {
	return async (req: Request): Promise<Response> => {
		if (!sameOrigin(req)) return reply({ error: "Forbidden" }, 403);
		const ip = hashIp(req);
		if (overLimit(`${opts.key}:${ip}`, opts.perMinute)) return reply({ error: "Slow down" }, 429, { "Retry-After": "30" });
		const body = await readJson(req, opts.maxBody);
		const id = typeof body?.id === "string" && GROUP_ID_RE.test(body.id) ? body.id : null;
		const token = cleanToken(body?.token);
		if (!body || !id || !token) return reply({ error: "Invalid request" }, 400);
		try {
			const db = getDb();
			await ensureSchema(db);
			return await handler({ db, body, ip, id, token });
		} catch (err) {
			if (err instanceof FeedbackUnavailableError) return reply({ error: "Offline" }, 503);
			console.error(`group ${opts.key} failed`, (err as Error).message);
			return reply({ error: "Something went wrong" }, 500);
		}
	};
}

/** Loads a live group and checks the token. 404: no such group (or deleted). 403: wrong token, e.g. a wrong passphrase. */
type Authorized = { ok: true; head: number; snapshotSeq: number; expiresAt: number } | { ok: false; error: Response };

export async function authorize(db: Client, id: string, token: string): Promise<Authorized> {
	const res = await db.execute({
		sql: "SELECT auth_hash, head_seq, snapshot_seq, expires_at FROM groups WHERE id = ? AND expires_at > ?",
		args: [id, Date.now()],
	});
	const row = res.rows[0];
	if (!row) return { ok: false, error: reply({ error: "Not found" }, 404) };
	if (!tokenMatches(token, String(row.auth_hash))) return { ok: false, error: reply({ error: "Wrong key" }, 403) };
	return { ok: true, head: Number(row.head_seq), snapshotSeq: Number(row.snapshot_seq), expiresAt: Number(row.expires_at) };
}

export { MAX_OPS_PER_PULL, MAX_OPS_BLOB, MAX_SNAPSHOT_BLOB };
