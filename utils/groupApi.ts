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
