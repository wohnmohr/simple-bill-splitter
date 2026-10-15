import { sanitizePayment, sanitizeRequest, type PayRequest } from "@/utils/payStory";
import { SPLIT_ID_RE, SPLIT_KEY_RE, newVault, open, seal, writeToken } from "@/utils/splitVault";
import type { Claim } from "@/utils/billClaims";

/** Cloud splits are deleted this many days after they're created (keeps the free service cheap and private). */
export const SPLIT_TTL_DAYS = 30;

/** Share path for a cloud split; the key rides in the fragment and never reaches the server. */
export const cloudPath = (id: string, key: string) => `/s/${id}#${key}`;

/** Encrypts and stores a new split. Returns its share path. Throws if the cloud is unavailable. */
export async function createCloudSplit(req: PayRequest): Promise<string> {
	const { id, key } = newVault();
	const { paid: _paid, claims: _claims, ...split } = req;
	const [blob, token] = await Promise.all([seal(key, id, "split", split), writeToken(key)]);
	const res = await fetch("/api/splits", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id, token, blob }),
	});
	if (!res.ok) throw new Error(`create failed: ${res.status}`);
	return cloudPath(id, key);
}

export type CloudLoad =
	| { status: "ok"; req: PayRequest; expiresAt: number; version: number }
	| { status: "unchanged" }
	| { status: "missing" | "locked" | "offline" };

/**
 * One entry in a split's append-only log: a payment mark, or a claim on an
 * itemised bill. Both share the log (and its version), so one poll sees either;
 * the record kind is sealed into each entry, so the server can't tell them apart.
 */
export type CloudEntry = { kind: "payment"; data: [string, number] } | { kind: "claim"; data: Claim };

/** Opens a log entry as whichever kind it was sealed as. */
async function openEntry(key: string, id: string, blob: string): Promise<CloudEntry | null> {
	const payment = await open(key, id, "payment", blob);
	if (payment) return { kind: "payment", data: payment as [string, number] };
	const claim = await open(key, id, "claim", blob);
	return claim ? { kind: "claim", data: claim as Claim } : null;
}

/**
 * Fetches and decrypts a split and its log (payments and claims). Pass the `version` you already
 * have and an unchanged split comes back as { status: "unchanged" } (one cheap read).
 */
export async function loadCloudSplit(id: string, key: string, version?: number): Promise<CloudLoad> {
	if (!SPLIT_ID_RE.test(id) || !SPLIT_KEY_RE.test(key)) return { status: "locked" };
	let res: Response;
	try {
		// The first load takes the response the page preloaded; the server marks every answer no-store.
		res = await fetch(`/api/splits/${id}${version === undefined ? "" : `?v=${version}`}`);
	} catch {
		return { status: "offline" };
	}
	if (res.status === 404) return { status: "missing" };
	if (!res.ok) return { status: "offline" };
	const body = (await res.json()) as { unchanged?: boolean; blob: string; payments: string[]; expiresAt: number; version: number };
	if (body.unchanged) return { status: "unchanged" };
	const split = await open(key, id, "split", body.blob);
	if (!split) return { status: "locked" };
	const entries = await Promise.all(body.payments.map((b) => openEntry(key, id, b)));
	const pick = (kind: CloudEntry["kind"]) => entries.flatMap((e) => (e?.kind === kind ? [e.data] : []));
	const req = sanitizeRequest({ ...(split as object), paid: pick("payment").map(sanitizePayment).filter(Boolean), claims: pick("claim") });
	return req ? { status: "ok", req, expiresAt: body.expiresAt, version: body.version } : { status: "locked" };
}

/** Encrypts and appends one payment or claim. Throws if it couldn't be saved. */
export async function addCloudEntry(id: string, key: string, entry: CloudEntry): Promise<void> {
	const [blob, token] = await Promise.all([seal(key, id, entry.kind, entry.data), writeToken(key)]);
	const res = await fetch(`/api/splits/${id}/payments`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ token, blob }),
	});
	if (!res.ok) throw new Error(`${entry.kind} failed: ${res.status}`);
}
