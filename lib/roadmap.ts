import "server-only";
import { parseRoadmap, STATIC_ROADMAP, type Roadmap } from "@/content/roadmap";

/**
 * The roadmap from the project's Edge Config, read over its REST API so the
 * page stays static and is rebuilt in the background at most once a minute.
 * EDGE_CONFIG is the connection string Vercel adds when the store is
 * connected to the project (https://edge-config.vercel.com/<id>?token=…).
 * Falls back to the lists in content/roadmap.ts if it is unset, slow, down
 * or malformed.
 */
export async function getRoadmap(): Promise<Roadmap> {
	const connection = process.env.EDGE_CONFIG;
	if (!connection) return STATIC_ROADMAP;
	try {
		const url = new URL(connection);
		url.pathname += "/item/roadmap";
		const res = await fetch(url, { next: { revalidate: 60 }, signal: AbortSignal.timeout(3000) });
		if (res.ok) return parseRoadmap(await res.json()) ?? STATIC_ROADMAP;
		console.error(`roadmap: Edge Config returned ${res.status}`);
	} catch (err) {
		console.error("roadmap: Edge Config unreachable", err instanceof Error ? err.name : "");
	}
	return STATIC_ROADMAP;
}
