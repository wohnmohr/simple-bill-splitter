import "server-only";
import { createHash } from "node:crypto";
import type { Client } from "@libsql/client";
import webpush, { type PushSubscription } from "web-push";

/**
 * Opt-in alerts for synced groups, sent with Web Push. An alert carries only
 * the group's lookup id, encrypted to the device by the Web Push standard, so
 * neither we nor the push service learn anything about the group's contents;
 * the device's own service worker turns the id into the group's name.
 *
 * Alerts are off until the VAPID keys are configured.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
export const alertsConfigured = Boolean(PUBLIC_KEY && PRIVATE_KEY);

/** Devices per group that can ask for alerts. */
export const MAX_ALERT_DEVICES = 50;
/** A device is alerted at most this often per group, however many changes arrive. */
const QUIET_MS = 2 * 60 * 1000;
/** An alert that can't be delivered in this time is dropped (seconds). */
const TTL_S = 6 * 60 * 60;

/**
 * Only the browsers' own push services: the server posts to this address, so
 * it must never be somewhere of the caller's choosing.
 */
const PUSH_HOST = /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$/;
const KEY_RE = /^[A-Za-z0-9_-]{16,128}$/;

export const endpointHash = (endpoint: string) => createHash("sha256").update(endpoint).digest("hex");
export const ENDPOINT_HASH_RE = /^[0-9a-f]{64}$/;

/** A push subscription from a browser, or null if it isn't one we'll post to. */
export function cleanSubscription(v: unknown): PushSubscription | null {
	const x = v as Partial<PushSubscription> | null;
	if (!x || typeof x.endpoint !== "string" || x.endpoint.length > 1000) return null;
	try {
		const url = new URL(x.endpoint);
		if (url.protocol !== "https:" || url.port || !PUSH_HOST.test(url.hostname)) return null;
	} catch {
		return null;
	}
	const { p256dh, auth } = x.keys ?? ({} as PushSubscription["keys"]);
	if (!KEY_RE.test(p256dh ?? "") || !KEY_RE.test(auth ?? "")) return null;
	return { endpoint: x.endpoint, keys: { p256dh, auth } };
}

/**
 * Alerts every device watching a group, except the one that made the change
 * (`quiet`, the hash of its own push address) and any alerted in the last
 * QUIET_MS. Addresses the push service says are gone are forgotten.
 */
export async function alertGroup(db: Client, groupId: string, quiet: string | null): Promise<void> {
	if (!alertsConfigured) return;
	const now = Date.now();
	const due = await db.execute({
		sql: "UPDATE group_push SET notified_at = ? WHERE group_id = ? AND endpoint_hash != ? AND notified_at < ? RETURNING endpoint_hash, sub",
		args: [now, groupId, quiet ?? "", now - QUIET_MS],
	});
	const gone: string[] = [];
	await Promise.all(
		due.rows.map(async (row) => {
			try {
				await webpush.sendNotification(JSON.parse(String(row.sub)), JSON.stringify({ g: groupId }), {
					TTL: TTL_S,
					// A newer alert for the same group replaces one still waiting to be delivered.
					topic: groupId,
					vapidDetails: { subject: "https://splitbiller.com", publicKey: PUBLIC_KEY!, privateKey: PRIVATE_KEY! },
				});
			} catch (err) {
				const status = (err as { statusCode?: number }).statusCode;
				if (status === 404 || status === 410) gone.push(String(row.endpoint_hash));
			}
		})
	);
	if (gone.length) {
		await db.execute({
			sql: `DELETE FROM group_push WHERE group_id = ? AND endpoint_hash IN (${gone.map(() => "?").join(",")})`,
			args: [groupId, ...gone],
		});
	}
}
