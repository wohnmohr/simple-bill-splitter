"use client";

import { useEffect } from "react";

/** Registers public/sw.js, which lets the installed app open offline. Production only, so dev builds are never served stale. */
export const ServiceWorkerRegistration = () => {
	useEffect(() => {
		if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
		navigator.serviceWorker.register("/sw.js").catch(() => {
			/* unsupported or blocked (private mode): the site works the same, just not offline */
		});
	}, []);
	return null;
};
