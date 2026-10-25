/**
 * Keeps one end-to-end encrypted group in step across devices.
 *
 * Local edits become operations (see groupOps), queue on the device, survive
 * reloads and offline spells, and are sealed and pushed in batches. Other
 * devices' batches are pulled, opened and merged. Because merging is
 * conflict-free, every device ends up with the same group; the server only
 * ever relays ciphertext it can't read.
 */
import type { Group, GroupSyncLink } from "@/types";
import { newId } from "@/utils/ids";
import {
	type Op,
	type SyncState,
	applyOp,
	applyOps,
	cloneState,
	diffGroup,
	emptyState,
	groupAsChanges,
	joinPending,
	materialize,
	mergeState,
	nextClock,
	pushBatch,
	repairClocks,
	sharedView,
} from "@/utils/groupOps";
import { quietTag } from "@/utils/groupAlerts";
import { HttpError, UnreadableError, api, syncCause } from "@/utils/groupApi";
import { secondsBucket, track, trackOnce, trackStorageFailure } from "@/lib/analytics";
import { type GroupKeys, deriveGroupKeys, linkFragment, newGroupSecret, openGroup, sealGroup, stretchPassphrase } from "@/utils/groupVault";

/** Fold history into a snapshot once this many batches pile up past the last one. */
const COMPACT_AFTER = 50;

export type SyncStatus = "synced" | "syncing" | "offline" | "gone" | "locked";

/** What a device remembers about a synced group, beside the group itself. */
type Saved = {
	/** Highest server sequence number this device has merged; -1 = nothing yet (the first snapshot is 0). */
	seq: number;
	snapshotSeq: number;
	/** Every change confirmed by the server, merged. */
	state: SyncState;
	/** Local changes not yet confirmed. */
	pending: Op[];
	expiresAt?: number;
	gone?: boolean;
	/** The group as last shown on screen, so a reload diffs real edits only. */
	shown?: Group;
};

const storeKey = (groupId: string) => `splitbiller-sync:${groupId}`;

function load(groupId: string): Saved | null {
	try {
		const s = JSON.parse(localStorage.getItem(storeKey(groupId)) || "null");
		if (!s || typeof s.seq !== "number" || !s.state) return null;
		// Saved before comments existed: give it their table.
		s.state = repairClocks({ ...emptyState(), ...s.state });
		return s;
	} catch {
		return null;
	}
}

function save(groupId: string, s: Saved) {
	try {
		localStorage.setItem(storeKey(groupId), JSON.stringify(s));
	} catch (err) {
		// Storage full or blocked: the queue still lives in memory for this visit.
		trackStorageFailure("sync", err);
	}
}

export const forgetSync = (groupId: string) => {
	try {
		localStorage.removeItem(storeKey(groupId));
	} catch {
		/* nothing to clean */
	}
};

/**
 * The group's link; with `me`, a member's personal link that opens the group as them on their other devices.
 * `settle` opens it on the settle-up tab (for payment reminders); it's the only part the server sees.
 */
export const groupUrl = (link: GroupSyncLink, me?: string, settle = false) =>
	`${window.location.origin}/g${settle ? `?${SETTLE_PARAM}` : ""}#${linkFragment(link.secret, Boolean(link.pass), me)}`;

export const SETTLE_PARAM = "settle";

const countBucket = (n: number) => (n === 0 ? "0" : n <= 5 ? "1-5" : n <= 20 ? "6-20" : "20+");

const stamp = (changes: Omit<Op, "i" | "t">[], after: number): Op[] => {
	let t = Math.max(Date.now(), after + 1);
	return changes.map((c) => ({ ...c, i: newId("o").slice(2), t: t++ }));
};

/** Reads a group from the server from scratch (for joining, or after losing local state). */
async function fetchAll(keys: GroupKeys): Promise<Saved> {
	const saved: Saved = { seq: -1, snapshotSeq: 0, state: emptyState(), pending: [] };
	for (let guard = 0; guard < 1000; guard++) {
		const res = await api("/pull", { id: keys.id, token: keys.token, after: saved.seq });
		if (await mergeResponse(keys, saved, res)) continue;
		return saved;
	}
	return saved;
}

/** Merges one pull response into `saved`. Returns true if the server has more. */
async function mergeResponse(keys: GroupKeys, saved: Saved, res: Record<string, unknown>): Promise<boolean> {
	saved.expiresAt = Number(res.expiresAt) || saved.expiresAt;
	saved.snapshotSeq = Number(res.snapshotSeq) || saved.snapshotSeq;
	if (res.unchanged) return false;
	const snap = res.snapshot as { seq: number; blob: string } | undefined;
	if (snap) {
		const opened = await openGroup(keys, "snapshot", snap.blob);
		if (opened === null) throw new UnreadableError("undecryptable snapshot");
		mergeState(saved.state, opened);
	}
	for (const row of (res.ops as { seq: number; blob: string }[]) ?? []) {
		const opened = (await openGroup(keys, "ops", row.blob)) as { ops?: unknown } | null;
		// A batch that won't open was not written with this key: skip it rather than stall.
		if (opened) applyOps(saved.state, opened.ops);
		else trackOnce("sync_batch_unreadable");
	}
	saved.seq = Math.max(saved.seq, Number(res.seq) || 0);
	return Boolean(res.more);
}

export type JoinResult = { ok: true; group: Group } | { ok: false; reason: "wrong-passphrase" | "gone" | "offline"; cause: string };

/** Opens a group link on this device. `link.pass` is the Argon2id output of the passphrase, if any. */
export async function joinGroup(link: GroupSyncLink, localId: string): Promise<JoinResult> {
	try {
		const keys = await deriveGroupKeys(link.secret, link.pass);
		const saved = await fetchAll(keys);
		save(localId, saved);
		return { ok: true, group: materialize(saved.state, { id: localId, sync: link }) };
	} catch (err) {
		const cause = syncCause(err);
		if (cause === "wrong_key") return { ok: false, reason: "wrong-passphrase", cause };
		if (cause === "deleted") return { ok: false, reason: "gone", cause };
		return { ok: false, reason: "offline", cause };
	}
}

/** Uploads a local group as a new encrypted group. Returns the link to store on the group. */
export async function startSync(group: Group, passphrase?: string): Promise<GroupSyncLink> {
	const secret = await newGroupSecret();
	const link: GroupSyncLink = passphrase ? { secret, pass: await stretchPassphrase(secret, passphrase) } : { secret };
	const keys = await deriveGroupKeys(link.secret, link.pass);
	const state = emptyState();
	for (const op of stamp(groupAsChanges(group), 0)) applyOp(state, op);
	await api("", { id: keys.id, token: keys.token, blob: await sealGroup(keys, "snapshot", state) });
	save(group.id, { seq: 0, snapshotSeq: 0, state, pending: [] });
	return link;
}

/** Deletes the group's ciphertext from the server for everyone. */
export async function deleteForEveryone(link: GroupSyncLink): Promise<void> {
	const keys = await deriveGroupKeys(link.secret, link.pass);
	try {
		await api("/delete", { id: keys.id, token: keys.token });
	} catch (err) {
		if (!(err instanceof HttpError && err.status === 404)) throw err;
	}
}

/**
 * Live sync for one group on this device. `onChange` receives the merged group
 * whenever other devices' changes arrive; `onStatus` reports connectivity.
 */
export class GroupSync {
	private keys: Promise<GroupKeys>;
	private saved: Saved;
	/** The group as this engine last showed it; local edits are diffed against it. */
	private shown: Group;
	private busy: Promise<void> = Promise.resolve();
	private retryAt = 0;
	private disposed = false;
	/** When sync last went wrong, until it works again. */
	private troubleSince = 0;
	status: SyncStatus = "syncing";

	constructor(
		group: Group,
		/** Called when other devices' changes are ready; answer with reconcile(). */
		private onChange: () => void,
		private onStatus: (s: SyncStatus) => void
	) {
		const link = group.sync as GroupSyncLink;
		this.keys = deriveGroupKeys(link.secret, link.pass);
		const saved = load(group.id);
		// Diff only against what was actually on screen. With no record at all
		// (cleared storage), don't re-upload old values over other people's newer
		// edits: download the group again instead.
		this.saved = saved ?? { seq: -1, snapshotSeq: 0, state: emptyState(), pending: [] };
		this.shown = saved?.shown ?? group;
		if (this.saved.gone) this.status = "gone";
		this.observe(group);
		// If merged changes were saved but never reached the screen, show them now.
		if (saved && sharedView(this.view(group)) !== sharedView(group)) queueMicrotask(() => !this.disposed && this.onChange());
	}

	/**
	 * Brings the on-screen group up to date: first records any local edits not
	 * seen yet, then returns the merged group. Use inside a state updater, so an
	 * edit made a moment ago is never overwritten by an older screen.
	 */
	reconcile(local: Group): Group {
		this.observe(local);
		const merged = this.view(local);
		if (sharedView(merged) === sharedView(local)) return local;
		this.shown = this.saved.shown = merged;
		save(local.id, this.saved);
		return merged;
	}

	get expiresAt() {
		return this.saved.expiresAt;
	}

	get pendingCount() {
		return this.saved.pending.length;
	}

	dispose() {
		this.disposed = true;
	}

	private setStatus(s: SyncStatus) {
		if (this.status === s) return;
		this.status = s;
		this.onStatus(s);
	}

	private view(local: Group): Group {
		const merged = cloneState(this.saved.state);
		for (const op of this.saved.pending) applyOp(merged, op);
		return materialize(merged, local);
	}

	/**
	 * Records local edits: anything that differs from what this engine last
	 * showed becomes operations. Safe to call repeatedly with the same group.
	 */
	observe(group: Group): void {
		if (this.saved.gone) return;
		const changes = diffGroup(this.shown, group);
		this.shown = group;
		if (!changes.length) return;
		this.saved.pending.push(...stamp(changes, nextClock(this.saved.state, this.saved.pending)));
		this.saved.shown = group;
		save(group.id, this.saved);
		void this.sync(group.id);
	}

	/**
	 * Takes in what another tab of the app saved for this group: its merged
	 * changes and its queue, and its screen, so that tab's edits are not
	 * recorded again here as edits of this tab.
	 */
	adopt(group: Group): void {
		const theirs = load(group.id);
		if (theirs) {
			mergeState(this.saved.state, theirs.state);
			this.saved.seq = Math.max(this.saved.seq, theirs.seq);
			this.saved.snapshotSeq = Math.max(this.saved.snapshotSeq, theirs.snapshotSeq);
			this.saved.pending = joinPending(this.saved.state, this.saved.pending, theirs.pending);
			this.saved.gone ||= theirs.gone;
		}
		this.shown = this.saved.shown = group;
		save(group.id, this.saved);
	}

	/** Pushes queued changes, then pulls everyone else's. One run at a time. */
	sync(groupId: string, force = false): Promise<void> {
		if (this.disposed || this.saved.gone) return Promise.resolve();
		if (!force && Date.now() < this.retryAt) return this.busy;
		this.busy = this.busy.then(() => this.run(groupId)).catch(() => undefined);
		return this.busy;
	}

	private async run(groupId: string) {
		const keys = await this.keys;
		this.setStatus("syncing");
		try {
			while (this.saved.pending.length && !this.disposed) {
				const batch = pushBatch(this.saved.pending);
				if (!batch.length) {
					// A change too big for any request would block every later one: drop it.
					this.saved.pending = this.saved.pending.slice(1);
					track("sync_change_dropped");
					save(groupId, this.saved);
					continue;
				}
				try {
					await api("/push", { id: keys.id, token: keys.token, blob: await sealGroup(keys, "ops", { ops: batch }), quiet: await quietTag() });
				} catch (err) {
					if (err instanceof HttpError && err.status === 409 && err.body.compact) {
						await this.pull(keys, groupId);
						await this.compact(keys, true);
						continue;
					}
					throw err;
				}
				for (const op of batch) applyOp(this.saved.state, op);
				this.saved.pending = this.saved.pending.slice(batch.length);
				save(groupId, this.saved);
			}
			await this.pull(keys, groupId);
			await this.compact(keys);
			this.retryAt = 0;
			this.setStatus("synced");
			if (this.troubleSince) track("sync_recovered", { after: secondsBucket(Date.now() - this.troubleSince) });
			this.troubleSince = 0;
		} catch (err) {
			if (err instanceof HttpError && err.status === 404) {
				this.saved.gone = true;
				save(groupId, this.saved);
				this.setStatus("gone");
			} else if (err instanceof HttpError && err.status === 403) {
				this.setStatus("locked");
			} else {
				// Network or server trouble: keep the queue, back off, try again.
				this.retryAt = Date.now() + 10_000;
				this.setStatus("offline");
			}
			// Once per spell of trouble: retries every few seconds would only repeat it.
			if (!this.troubleSince) {
				this.troubleSince = Date.now();
				track("sync_problem", { status: this.status, cause: syncCause(err), pending: countBucket(this.saved.pending.length) });
			}
		}
	}

	private async pull(keys: GroupKeys, groupId: string) {
		const before = sharedView(this.shown);
		for (let more = true, guard = 0; more && guard < 100; guard++) {
			more = await mergeResponse(keys, this.saved, await api("/pull", { id: keys.id, token: keys.token, after: this.saved.seq }));
		}
		save(groupId, this.saved);
		// Only reconcile() moves what's on screen, so remote data is never mistaken for a local edit.
		if (sharedView(this.view(this.shown)) !== before && !this.disposed) this.onChange();
	}

	/** Folds history into one snapshot so new devices download a single blob. */
	private async compact(keys: GroupKeys, force = false) {
		if (!force && this.saved.seq - this.saved.snapshotSeq < COMPACT_AFTER) return;
		if (this.saved.seq <= this.saved.snapshotSeq) return;
		const res = await api("/snapshot", {
			id: keys.id,
			token: keys.token,
			upTo: this.saved.seq,
			blob: await sealGroup(keys, "snapshot", this.saved.state),
		});
		this.saved.snapshotSeq = Number(res.seq) || this.saved.snapshotSeq;
	}
}

export const syncShareText = (group: Group, url: string) =>
	`Join "${group.name}" on SplitBiller to add expenses together. It's end-to-end encrypted: ${url}`;

export { linkFragment };
