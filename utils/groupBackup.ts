/**
 * "Keep my groups safe": an opt-in, end-to-end encrypted copy of every group
 * on this device, so a new phone or a cleared browser can get them back.
 *
 * Nothing leaves the device until someone turns it on. The backup has its own
 * random secret, carried only in a recovery link's #fragment (/r#…), and is
 * stored with exactly the same scheme and endpoints as a synced group, so the
 * server can't tell a backup from a group, let alone read either. Its blobs
 * are sealed as kind "backup", so one can never be opened as a group.
 *
 * The backup is the groups list as saved on the device, sync links included:
 * a restored shared group downloads its latest changes like any new device.
 */
import type { Group, GroupSyncLink } from "@/types";
import { HttpError, api } from "@/utils/groupApi";
import { trackStorageFailure } from "@/lib/analytics";
import { deriveGroupKeys, linkFragment, newGroupSecret, openGroup, sealGroup, stretchPassphrase } from "@/utils/groupVault";

const STORE_KEY = "splitbiller-backup";
/** Re-saved at least this often while the app is used, well inside the server's 6-month expiry. */
export const REFRESH_MS = 30 * 24 * 60 * 60 * 1000;

/** What this device remembers about its backup. */
export type BackupState = {
	link: GroupSyncLink;
	/** Epoch ms of the last upload that reached the server. */
	savedAt?: number;
	/** Fingerprint of what was last uploaded, so unchanged groups aren't sent again. */
	digest?: string;
	/** Ids of this device's groups in that upload, so a group deleted here leaves the backup. */
	ids?: string[];
	/** The server no longer has it (left alone for 6 months): it needs turning on again. */
	gone?: true;
};

export function loadBackup(): BackupState | null {
	try {
		const s = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
		return s?.link?.secret ? s : null;
	} catch {
		return null;
	}
}

export function storeBackup(s: BackupState | null) {
	try {
		if (s) localStorage.setItem(STORE_KEY, JSON.stringify(s));
		else localStorage.removeItem(STORE_KEY);
	} catch (err) {
		// Storage blocked: the backup simply stays off on this device.
		trackStorageFailure("backup", err);
	}
}

export const recoveryUrl = (link: GroupSyncLink) => `${window.location.origin}/r#${linkFragment(link.secret, Boolean(link.pass))}`;

/** A fingerprint of the groups, to skip uploads when nothing changed. */
async function digestOf(groups: Group[]): Promise<string> {
	const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(groups)));
	return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Turns the backup on: a new secret, and the first encrypted copy on the server. */
export async function startBackup(groups: Group[], passphrase?: string): Promise<BackupState> {
	const secret = await newGroupSecret();
	const link: GroupSyncLink = passphrase ? { secret, pass: await stretchPassphrase(secret, passphrase) } : { secret };
	const keys = await deriveGroupKeys(link.secret, link.pass);
	await api("", { id: keys.id, token: keys.token, blob: await sealGroup(keys, "backup", { groups }) });
	return { link, savedAt: Date.now(), digest: await digestOf(groups), ids: groups.map((g) => g.id) };
}

/**
 * Replaces the copy on the server when the groups changed, or when it's due a
 * refresh. A device restored from the recovery link saves to it too, so the
 * copy is read first and groups only another device has are kept. The server
 * only swaps a snapshot in after a change, so a tiny empty batch goes first.
 * Returns the new state, or the same one if nothing was sent.
 */
export async function saveBackup(state: BackupState, groups: Group[], now = Date.now()): Promise<BackupState> {
	const digest = await digestOf(groups);
	if (digest === state.digest && now - (state.savedAt ?? 0) < REFRESH_MS) return state;
	const keys = await deriveGroupKeys(state.link.secret, state.link.pass);
	const mine = new Set(state.ids);
	for (let tries = 0; tries < 3; tries++) {
		const current = await pullBackup(keys);
		const others = current.groups.filter((g) => !mine.has(g.id));
		const { seq } = await api("/push", { id: keys.id, token: keys.token, blob: await sealGroup(keys, "ops", { ops: [] }) });
		// Another device saved since the read: read again rather than drop its groups.
		if (seq !== current.head + 1) continue;
		const blob = await sealGroup(keys, "backup", { groups: mergeRestored(groups, others, Infinity).groups });
		const snap = await api("/snapshot", { id: keys.id, token: keys.token, upTo: seq, blob });
		if (snap.seq === seq) return { ...state, savedAt: now, digest, ids: groups.map((g) => g.id) };
	}
	throw new Error("backup busy"); // the next change or visit tries again
}

async function pullBackup(keys: Awaited<ReturnType<typeof deriveGroupKeys>>): Promise<{ groups: Group[]; head: number }> {
	const res = await api("/pull", { id: keys.id, token: keys.token, after: -1 });
	const snap = res.snapshot as { blob: string } | undefined;
	const opened = snap && ((await openGroup(keys, "backup", snap.blob)) as { groups?: unknown } | null);
	if (!opened || !Array.isArray(opened.groups)) throw new Error("not a backup");
	return { groups: opened.groups.filter(isGroup), head: Number(res.head) };
}

/** Reads a backup from its recovery link. Throws HttpError 403 for a wrong passphrase, 404 if it's gone. */
export async function readBackup(link: GroupSyncLink): Promise<Group[]> {
	return (await pullBackup(await deriveGroupKeys(link.secret, link.pass))).groups;
}

/** Turns the backup off and deletes the copy on the server. */
export async function stopBackup(link: GroupSyncLink): Promise<void> {
	const keys = await deriveGroupKeys(link.secret, link.pass);
	try {
		await api("/delete", { id: keys.id, token: keys.token });
	} catch (err) {
		if (!(err instanceof HttpError && err.status === 404)) throw err;
	}
}

const isGroup = (g: unknown): g is Group => {
	const x = g as Partial<Group> | null;
	return !!x && typeof x.id === "string" && typeof x.name === "string" && Array.isArray(x.members) && Array.isArray(x.expenses) && !!x.currency;
};

/**
 * Adds restored groups this device doesn't have yet. A group already here
 * (same id, or the same shared group under another id) keeps this device's copy.
 * `missed`: new groups that didn't fit under `max`.
 */
export function mergeRestored(local: Group[], restored: Group[], max: number): { groups: Group[]; added: number; missed: number } {
	const ids = new Set(local.map((g) => g.id));
	const secrets = new Set(local.flatMap((g) => (g.sync ? [g.sync.secret] : [])));
	const fresh = restored.filter((g) => !ids.has(g.id) && !(g.sync && secrets.has(g.sync.secret)));
	const room = fresh.slice(0, Math.max(0, max - local.length));
	return { groups: [...local, ...room], added: room.length, missed: fresh.length - room.length };
}
