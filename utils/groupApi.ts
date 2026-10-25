/** The /api/groups endpoints, shared by synced groups and backups. The server only ever sees ids, tokens and ciphertext. */

export class HttpError extends Error {
	readonly status: number;
	readonly body: Record<string, unknown>;
	constructor(status: number, body: Record<string, unknown>) {
		super(`HTTP ${status}`);
		this.status = status;
		this.body = body;
	}
}

/** A group snapshot that won't open with this group's key: a damaged or mismatched link, never a network blip. */
export class UnreadableError extends Error {}

/** Why sync failed, in words that say nothing about the group. */
export function syncCause(err: unknown): string {
	if (err instanceof UnreadableError) return "unreadable";
	if (err instanceof HttpError) {
		if (err.status === 403) return "wrong_key";
		if (err.status === 404) return "deleted";
		if (err.status === 429) return "rate_limited";
		return err.status >= 500 ? "server" : "rejected";
	}
	return typeof navigator !== "undefined" && !navigator.onLine ? "device_offline" : "network";
}

export async function api(path: string, body: unknown): Promise<Record<string, unknown>> {
	const res = await fetch(`/api/groups${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		cache: "no-store",
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new HttpError(res.status, data);
	return data;
}
