import { useCallback, useEffect, useState } from "react";
import type { Group } from "@/types";
import { type BackupState, loadBackup, saveBackup, startBackup, stopBackup, storeBackup } from "@/utils/groupBackup";
import { track, trackOnce } from "@/lib/analytics";
import { HttpError, syncCause } from "@/utils/groupApi";

/** Waits for typing to settle before uploading. */
const DEBOUNCE_MS = 4000;

/**
 * The opt-in backup of this device's groups. Off until `turnOn`; then every
 * change is uploaded, encrypted, a few seconds after it settles.
 */
export const useBackup = (groups: Group[], loaded: boolean) => {
	const [backup, setBackup] = useState<BackupState | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => setBackup(loadBackup()), []);

	const keep = (s: BackupState | null) => {
		storeBackup(s);
		setBackup(s);
	};

	useEffect(() => {
		if (!loaded || !backup || backup.gone) return;
		const timer = setTimeout(async () => {
			try {
				const next = await saveBackup(backup, groups);
				setFailed(false);
				if (next !== backup) keep(next);
			} catch (err) {
				if (err instanceof HttpError && err.status === 404) keep({ ...backup, gone: true });
				else {
					setFailed(true); // offline: the next change or visit tries again
					trackOnce("backup_save_failed", { cause: syncCause(err) });
				}
			}
		}, DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [groups, loaded, backup]);

	const turnOn = useCallback(async (passphrase?: string) => {
		const s = await startBackup(groups, passphrase);
		keep(s);
		track("backup_turned_on", { passphrase: Boolean(passphrase), groups: groups.length });
		return s;
	}, [groups]);

	const turnOff = useCallback(async () => {
		if (backup) await stopBackup(backup.link);
		keep(null);
		track("backup_turned_off");
	}, [backup]);

	return { backup, failed, turnOn, turnOff };
};
