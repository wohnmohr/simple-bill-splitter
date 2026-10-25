import "server-only";
import type { Client } from "@libsql/client";
import { FeedbackUnavailableError, hashIp, withDb } from "@/lib/turso";
import { cleanToken, hashToken, overLimit, reply, sameOrigin, tokenMatches } from "@/lib/splitStore";

/**
 * Guard rails for synced groups. Like split links, the server can't read what
 * it stores, so abuse is bounded by shape and volume: same-origin writes,
 * size-capped ciphertext, per-IP and global quotas, a cap on uncompacted
 * changes per group, and groups that delete themselves when left alone.
 *
 * Privacy: rows carry no IP, name or creation time. Quotas count by a salted
 * IP hash in api_quota, never next to a group id; the wrong-key counter is
 * per group and carries no IP. All counters are purged after two days.
 */

/** Groups untouched this long are deleted. Every change pushes it back. */
export const GROUP_TTL_MS = 180 * 24 * 60 * 60 * 1000;
/** Changes kept before a snapshot must fold them in (clients compact well before this). */
export const MAX_UNCOMPACTED = 2000;
const MAX_OPS_PER_PULL = 200;
/** Ciphertext per pull response, kept well under the host's 4.5 MB response limit. */
const MAX_PULL_CHARS = 3_000_000;
/** 64 KB padded batch → about 87,500 base64url characters. */
const MAX_OPS_BLOB = 90_000;
/** 512 KB padded snapshot → about 700,000 base64url characters. */
const MAX_SNAPSHOT_BLOB = 720_000;
const BLOB_RE = /^[A-Za-z0-9_-]+$/;
export const GROUP_ID_RE = /^[A-Za-z0-9_-]{22}$/;

const NEW_GROUPS_PER_IP_PER_DAY = 30;
const NEW_GROUPS_PER_DAY = Number(process.env.GROUPS_PER_DAY_MAX) || 5000;
const PUSHES_PER_IP_PER_DAY = 3000;
/**
 * Different wrong tokens a group accepts per day before it stops answering
 * any, right or wrong, until tomorrow. With a leaked link, each passphrase
 * guess is one wrong token, so guessing online stays hopeless; a device
 * stuck on one old token counts once, however often it retries.
 */
const WRONG_TOKENS_PER_DAY = 30;
/** Ciphertext stored per day (new groups and pushed changes), per IP and across everyone, so storage can't be filled. */
const STORED_CHARS_PER_IP_PER_DAY = 50_000_000;
const STORED_CHARS_PER_DAY = Number(process.env.GROUP_CHARS_PER_DAY_MAX) || 1_000_000_000;

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

const today = () => Math.floor(Date.now() / 86_400_000);

/** api_quota rows `g:bad:<id>:<day>:<token hash>`, one per different wrong token. */
const wrongPrefix = (id: string) => `g:bad:${id}:${today()}:`;
/** Counts today's wrong tokens for a group; `;` sorts right after `:`, so this is a range scan of the prefix. */
const WRONG_COUNT = "(SELECT COUNT(*) FROM api_quota WHERE bucket > ? AND bucket < ?)";
const wrongRange = (id: string) => [wrongPrefix(id), wrongPrefix(id).slice(0, -1) + ";"];

/** Reads a live group with what checkAuth needs. */
export const selectGroup = (id: string) => ({
	sql: `SELECT auth_hash, head_seq, snapshot_seq, expires_at, ${WRONG_COUNT} AS wrong FROM groups WHERE id = ? AND expires_at > ?`,
	args: [...wrongRange(id), id, Date.now()],
});

/** Adds `by` to a quota counter and returns the new count. */
const bump = (bucket: string, now: number, by = 1) => ({
	sql: "INSERT INTO api_quota (bucket, at, n) VALUES (?, ?, ?) ON CONFLICT (bucket) DO UPDATE SET n = n + excluded.n RETURNING n",
	args: [bucket, now, by],
});

/** Today's stored-ciphertext counters: this IP's (counts every attempt) and everyone's (counts only what was stored). */
const storedBuckets = (ip: string) => ({ mine: `g:chars:${ip}:${today()}`, all: `g:chars:${today()}` });

/** SQL condition: both stored-ciphertext counters have room for `chars` more. Bind storedRoomArgs after it. */
const STORED_ROOM =
	"(SELECT n FROM api_quota WHERE bucket = ?) <= ? AND COALESCE((SELECT n FROM api_quota WHERE bucket = ?), 0) + ? <= ?";
const storedRoomArgs = (b: { mine: string; all: string }, chars: number) => [b.mine, STORED_CHARS_PER_IP_PER_DAY, b.all, chars, STORED_CHARS_PER_DAY];

/** Adds `chars` to everyone's counter, only if the statement just before it stored a row. */
const chargeStored = (b: { all: string }, chars: number, now: number) => ({
	sql: "INSERT INTO api_quota (bucket, at, n) SELECT ?, ?, ? WHERE changes() = 1 ON CONFLICT (bucket) DO UPDATE SET n = n + excluded.n",
	args: [b.all, now, chars],
});

/**
 * Creates a group in one transaction: counts it against this IP's daily
 * quota, then (only if that has room) the global one, and inserts the row
 * only if both do and today's stored-ciphertext ceilings have room too.
 */
export async function insertGroup(
	db: Client,
	g: { ip: string; id: string; token: string; blob: string; expiresAt: number }
): Promise<"created" | "exists" | "quota"> {
	const now = Date.now();
	const mine = `g:new:${g.ip}:${today()}`;
	const all = `g:new:${today()}`;
	const stored = storedBuckets(g.ip);
	const [existing, , , , inserted] = await db.batch(
		[
			{ sql: "SELECT 1 FROM groups WHERE id = ?", args: [g.id] },
			bump(mine, now),
			bump(stored.mine, now, g.blob.length),
			{
				sql: `INSERT INTO api_quota (bucket, at, n) SELECT ?, ?, 1 WHERE (SELECT n FROM api_quota WHERE bucket = ?) <= ?
				      ON CONFLICT (bucket) DO UPDATE SET n = n + 1`,
				args: [all, now, mine, NEW_GROUPS_PER_IP_PER_DAY],
			},
			{
				sql: `INSERT INTO groups (id, auth_hash, expires_at, snapshot)
				      SELECT ?, ?, ?, ? WHERE (SELECT n FROM api_quota WHERE bucket = ?) <= ? AND (SELECT n FROM api_quota WHERE bucket = ?) <= ? AND ${STORED_ROOM}
				      ON CONFLICT (id) DO NOTHING`,
				args: [g.id, hashToken(g.token), g.expiresAt, g.blob, mine, NEW_GROUPS_PER_IP_PER_DAY, all, NEW_GROUPS_PER_DAY, ...storedRoomArgs(stored, g.blob.length)],
			},
			chargeStored(stored, g.blob.length, now),
		],
		"write"
	);
	if (inserted.rowsAffected) return "created";
	return existing.rows.length ? "exists" : "quota";
}

/**
 * Appends one encrypted batch of changes in a single transaction, and so a
 * single round trip: the token, the daily push and stored-ciphertext quotas
 * and the compaction cap are all checked by the insert itself. Comparing
 * SHA-256 digests in SQL leaks nothing an attacker can use, as a matching
 * digest can't be built up byte by byte. On refusal, the group row read
 * first says why.
 */
export async function appendOps(db: Client, g: { ip: string; id: string; token: string; blob: string }): Promise<Response> {
	const now = Date.now();
	const bucket = `g:push:${g.ip}:${today()}`;
	const stored = storedBuckets(g.ip);
	const [group, quota, mineStored, inserted, head] = await db.batch(
		[
			selectGroup(g.id),
			bump(bucket, now),
			bump(stored.mine, now, g.blob.length),
			{
				sql: `INSERT INTO group_ops (group_id, seq, blob) SELECT id, head_seq + 1, ? FROM groups
				      WHERE id = ? AND expires_at > ? AND auth_hash = ? AND head_seq - snapshot_seq < ? AND (SELECT n FROM api_quota WHERE bucket = ?) <= ? AND ${STORED_ROOM}
				      AND ${WRONG_COUNT} < ?`,
				args: [g.blob, g.id, now, hashToken(g.token), MAX_UNCOMPACTED, bucket, PUSHES_PER_IP_PER_DAY, ...storedRoomArgs(stored, g.blob.length), ...wrongRange(g.id), WRONG_TOKENS_PER_DAY],
			},
			// Parallel pushes queue behind each other, so none is lost or numbered twice,
			// and a reader never sees the head ahead of the rows.
			{ sql: "UPDATE groups SET head_seq = head_seq + 1, expires_at = ? WHERE id = ? AND changes() = 1 RETURNING head_seq", args: [now + GROUP_TTL_MS, g.id] },
			chargeStored(stored, g.blob.length, now),
		],
		"write"
	);
	if (inserted.rowsAffected && head.rows[0]) return reply({ ok: true, seq: Number(head.rows[0].head_seq) }, 201);
	const auth = await checkAuth(db, g.id, group.rows[0], g.token);
	if (!auth.ok) return auth.error;
	if (auth.head - auth.snapshotSeq >= MAX_UNCOMPACTED) return reply({ error: "Compact first", compact: true }, 409);
	if (Number(quota.rows[0]?.n ?? 0) > PUSHES_PER_IP_PER_DAY || Number(mineStored.rows[0]?.n ?? 0) > STORED_CHARS_PER_IP_PER_DAY)
		return reply({ error: "Too many changes today. Try again tomorrow." }, 429, { "Retry-After": "86400" });
	// Everyone's daily ceiling is full; the change stays queued on the device.
	return reply({ error: "Busy" }, 503, { "Retry-After": "3600" });
}

/** Keeps the pulled changes that fit one response, always at least one; the client pulls again for the rest. */
export function fitPull<T extends { blob: string }>(rows: T[], snapshotChars: number): T[] {
	let chars = snapshotChars;
	const fit: T[] = [];
	for (const row of rows) {
		if (fit.length && chars + row.blob.length > MAX_PULL_CHARS) break;
		fit.push(row);
		chars += row.blob.length;
	}
	return fit;
}

/** auth_hash of a deleted group: no token hashes to it. */
const DELETED = "deleted";

/**
 * Deletes a group's ciphertext for everyone (also how a link is reset), but
 * keeps the id as an empty row until it expires. So someone who still has the
 * old link, like a person removed by a reset, can't make the group again under
 * that id, and a device that missed the reset is told the group is gone.
 */
export async function deleteGroup(db: Client, id: string): Promise<void> {
	await db.batch(
		[
			{ sql: "DELETE FROM group_ops WHERE group_id = ?", args: [id] },
			{ sql: "DELETE FROM group_push WHERE group_id = ?", args: [id] },
			{
				sql: "UPDATE groups SET auth_hash = ?, snapshot = '', head_seq = 0, snapshot_seq = 0, expires_at = ? WHERE id = ?",
				args: [DELETED, Date.now() + GROUP_TTL_MS, id],
			},
		],
		"write"
	);
}

/** Deletes groups nobody has changed for GROUP_TTL_MS, with their changes and alert sign-ups, and stale quota counters. */
export async function purgeExpiredGroups(db: Client): Promise<void> {
	const now = Date.now();
	await db.batch(
		[
			{ sql: "DELETE FROM group_ops WHERE group_id IN (SELECT id FROM groups WHERE expires_at <= ?)", args: [now] },
			{ sql: "DELETE FROM group_push WHERE group_id IN (SELECT id FROM groups WHERE expires_at <= ?)", args: [now] },
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
			return await withDb((db) => handler({ db, body, ip, id, token }));
		} catch (err) {
			if (err instanceof FeedbackUnavailableError) return reply({ error: "Offline" }, 503);
			console.error(`group ${opts.key} failed`, (err as Error).message);
			return reply({ error: "Something went wrong" }, 500);
		}
	};
}

/**
 * 404: no such group (or deleted). 429: too many wrong tokens today.
 * 403: wrong token, e.g. a wrong passphrase.
 */
type Authorized = { ok: true; head: number; snapshotSeq: number; expiresAt: number } | { ok: false; error: Response };

/** Checks a row from selectGroup against the caller's token, and counts a wrong one. */
export async function checkAuth(db: Client, id: string, row: Record<string, unknown> | undefined, token: string): Promise<Authorized> {
	if (!row || row.auth_hash === DELETED) return { ok: false, error: reply({ error: "Not found" }, 404) };
	if (Number(row.wrong) >= WRONG_TOKENS_PER_DAY) return { ok: false, error: reply({ error: "Too many wrong tries. Try again tomorrow." }, 429, { "Retry-After": "3600" }) };
	if (!tokenMatches(token, String(row.auth_hash))) {
		await db.execute({
			sql: "INSERT INTO api_quota (bucket, at, n) VALUES (?, ?, 1) ON CONFLICT (bucket) DO NOTHING",
			args: [wrongPrefix(id) + hashToken(token).slice(0, 16), Date.now()],
		});
		return { ok: false, error: reply({ error: "Wrong key" }, 403) };
	}
	return { ok: true, head: Number(row.head_seq), snapshotSeq: Number(row.snapshot_seq), expiresAt: Number(row.expires_at) };
}

/** Loads a live group and checks the token. */
export async function authorize(db: Client, id: string, token: string): Promise<Authorized> {
	const res = await db.execute(selectGroup(id));
	return checkAuth(db, id, res.rows[0], token);
}

export { MAX_OPS_PER_PULL, MAX_OPS_BLOB, MAX_SNAPSHOT_BLOB };
