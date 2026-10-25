import { useCallback, useEffect, useRef, useState } from "react";
import type { Group } from "@/types";
import { GroupSync, type SyncStatus, deleteForEveryone, forgetSync, startSync } from "@/utils/groupSync";
import { meAfter } from "@/utils/members";
import { disableAlerts } from "@/utils/groupAlerts";

// Live while someone is looking, quieter when idle, silent when away.
const TICK_MS = 15_000;
const IDLE_AFTER_MS = 5 * 60_000;
const AWAY_AFTER_MS = 30 * 60_000;

/**
 * Runs one sync engine per synced group: local edits go out as they happen,
 * other devices' edits come in on a polite poll (every 15 s while the page is
 * open, slower when idle, none in a background tab).
 */
export function useGroupSync(
	groups: Group[],
	setGroups: React.Dispatch<React.SetStateAction<Group[]>>,
	selectedGroupId: string | null
) {
	const engines = useRef(new Map<string, GroupSync>());
	const [status, setStatus] = useState<Record<string, SyncStatus>>({});
	// Groups pulled at least once this visit: until then this device's copy may be out of date.
	const [pulled, setPulled] = useState<ReadonlySet<string>>(() => new Set());
	const selected = useRef(selectedGroupId);
	selected.current = selectedGroupId;
	const current = useRef(groups);
	current.current = groups;

	const reconcile = useCallback(
		(id: string) =>
			setGroups((prev) =>
				prev.map((g) => {
					const engine = engines.current.get(g.id);
					if (g.id !== id || !engine) return g;
					const merged = engine.reconcile(g);
					return { ...merged, meId: meAfter(g, merged), sync: g.sync };
				})
			),
		[setGroups]
	);

	// Start engines for synced groups, feed them edits, stop them for groups that left.
	useEffect(() => {
		const live = new Set<string>();
		for (const g of groups) {
			if (!g.sync) continue;
			live.add(g.id);
			const engine = engines.current.get(g.id);
			if (engine) {
				engine.observe(g);
				continue;
			}
			const created = new GroupSync(
				g,
				() => reconcile(g.id),
				(s) => {
					setStatus((prev) => ({ ...prev, [g.id]: s }));
					if (s === "synced") setPulled((prev) => (prev.has(g.id) ? prev : new Set(prev).add(g.id)));
				}
			);
			engines.current.set(g.id, created);
			setStatus((prev) => ({ ...prev, [g.id]: created.status }));
			void created.sync(g.id);
		}
		for (const [id, engine] of engines.current) {
			if (!live.has(id)) {
				engine.dispose();
				engines.current.delete(id);
			}
		}
	}, [groups, reconcile]);

	useEffect(() => () => engines.current.forEach((e) => e.dispose()), []);

	// Polling: the open group every tick, others every fourth.
	useEffect(() => {
		let ticks = 0;
		let lastActive = Date.now();
		const syncAll = (force = false) => {
			for (const [id, engine] of engines.current) void engine.sync(id, force);
		};
		const tick = () => {
			ticks++;
			if (document.visibilityState !== "visible") return;
			const idle = Date.now() - lastActive;
			if (idle > AWAY_AFTER_MS || (idle > IDLE_AFTER_MS && ticks % 4 !== 0)) return;
			for (const [id, engine] of engines.current) if (id === selected.current || ticks % 4 === 0) void engine.sync(id);
		};
		const wake = () => {
			const wasAway = Date.now() - lastActive > IDLE_AFTER_MS;
			lastActive = Date.now();
			if (wasAway && document.visibilityState === "visible") syncAll();
		};
		const onVisible = () => document.visibilityState === "visible" && syncAll();
		const onOnline = () => syncAll(true);
		const timer = window.setInterval(tick, TICK_MS);
		document.addEventListener("visibilitychange", onVisible);
		window.addEventListener("online", onOnline);
		window.addEventListener("pointerdown", wake);
		window.addEventListener("keydown", wake);
		return () => {
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", onVisible);
			window.removeEventListener("online", onOnline);
			window.removeEventListener("pointerdown", wake);
			window.removeEventListener("keydown", wake);
		};
	}, []);

	/** Encrypts and uploads a local group, then keeps it in sync. */
	const enableSync = useCallback(
		async (group: Group, passphrase?: string) => {
			// Whoever shares the group is its host.
			const { hostId: _old, ...rest } = group;
			const shared: Group = group.meId ? { ...rest, hostId: group.meId } : rest;
			const link = await startSync(shared, passphrase);
			setGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, hostId: shared.hostId, sync: link } : g)));
			return link;
		},
		[setGroups]
	);

	/** Stops syncing on this device and keeps the group as a local copy. */
	const keepLocalCopy = useCallback(
		(groupId: string) => {
			// A copy that no longer syncs gets no news, so no alerts either.
			const group = current.current.find((g) => g.id === groupId);
			if (group) disableAlerts(group).catch(() => undefined);
			engines.current.get(groupId)?.dispose();
			engines.current.delete(groupId);
			forgetSync(groupId);
			setStatus(({ [groupId]: _gone, ...rest }) => rest);
			setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, sync: undefined } : g)));
		},
		[setGroups]
	);

	/** Deletes the encrypted group from the server; everyone's copy stops syncing. */
	const deleteSyncedGroup = useCallback(
		async (group: Group) => {
			if (group.sync) await deleteForEveryone(group.sync);
			keepLocalCopy(group.id);
		},
		[keepLocalCopy]
	);

	/**
	 * Replaces the link: the group moves to a new key and the old link stops
	 * working. People with the old link keep what they already had, but see
	 * nothing new. Use it when someone shouldn't be in the group any more.
	 */
	const resetLink = useCallback(
		async (group: Group, passphrase?: string) => {
			const old = group.sync;
			engines.current.get(group.id)?.dispose();
			engines.current.delete(group.id);
			const link = await startSync({ ...group, sync: undefined }, passphrase);
			if (old) await deleteForEveryone(old).catch(() => undefined);
			setGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, sync: link } : g)));
			return link;
		},
		[setGroups]
	);

	const forgetGroup = useCallback((groupId: string) => {
		engines.current.get(groupId)?.dispose();
		engines.current.delete(groupId);
		forgetSync(groupId);
	}, []);

	/** Another tab saved these groups: take them in as they are, not as edits made here. */
	const adopt = useCallback((next: Group[]) => {
		for (const g of next) {
			const engine = engines.current.get(g.id);
			// A new link (reset in the other tab) needs a new engine; the effect starts it.
			if (engine && g.sync?.secret !== current.current.find((x) => x.id === g.id)?.sync?.secret) {
				engine.dispose();
				engines.current.delete(g.id);
			} else engine?.adopt(g);
		}
	}, []);

	const syncNow = useCallback((groupId: string) => engines.current.get(groupId)?.sync(groupId, true), []);
	const expiresAt = (groupId: string) => engines.current.get(groupId)?.expiresAt;

	return { status, pulled, enableSync, keepLocalCopy, deleteSyncedGroup, resetLink, forgetGroup, adopt, syncNow, expiresAt };
}
