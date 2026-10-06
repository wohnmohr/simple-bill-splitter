/** Secret Santa draw and the private "reveal" links built from it. */

export type Exclusion = [string, string];

/** What a single reveal link carries: one giver, one receiver. */
export type SantaPayload = {
	/** Event name */
	e: string;
	/** Giver */
	g: string;
	/** Receiver */
	r: string;
	/** Budget, free text (e.g. "₹500") */
	b?: string;
	/** Exchange date, free text */
	d?: string;
};

const randomBelow = (n: number) => {
	const buf = new Uint32Array(1);
	crypto.getRandomValues(buf);
	return Math.floor((buf[0] / 2 ** 32) * n);
};

const shuffle = <T,>(items: T[]): T[] => {
	const a = [...items];
	for (let i = a.length - 1; i > 0; i--) {
		const j = randomBelow(i + 1);
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
};

/**
 * Random assignment where nobody draws themselves or anyone they're excluded
 * from (exclusions are mutual). Returns null when no valid draw exists.
 */
export function drawSecretSanta(
	names: string[],
	exclusions: Exclusion[] = []
): Record<string, string> | null {
	if (names.length < 3) return null;

	const blocked = new Set(exclusions.flatMap(([a, b]) => [`${a}\n${b}`, `${b}\n${a}`]));
	const givers = shuffle(names);
	const taken = new Set<string>();
	const result: Record<string, string> = {};
	let steps = 0;

	const assign = (i: number): boolean => {
		if (i === givers.length) return true;
		if (++steps > 200_000) return false; // pathological constraints
		const giver = givers[i];
		for (const receiver of shuffle(names)) {
			if (receiver === giver || taken.has(receiver) || blocked.has(`${giver}\n${receiver}`)) continue;
			taken.add(receiver);
			result[giver] = receiver;
			if (assign(i + 1)) return true;
			taken.delete(receiver);
			delete result[giver];
		}
		return false;
	};

	return assign(0) ? result : null;
}

const toBase64Url = (text: string) => {
	const bytes = new TextEncoder().encode(text);
	let bin = "";
	bytes.forEach((b) => (bin += String.fromCharCode(b)));
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (value: string) => {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
	const bin = atob(padded);
	return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export const REVEAL_PATH = "/secret-santa";

export function encodeRevealLink(origin: string, payload: SantaPayload): string {
	return `${origin}${REVEAL_PATH}#${toBase64Url(JSON.stringify(payload))}`;
}

/** Returns null for anything that isn't a well-formed reveal link. */
export function decodeRevealHash(hash: string): SantaPayload | null {
	try {
		const data = JSON.parse(fromBase64Url(hash.replace(/^#/, "")));
		const text = (v: unknown, max: number) => typeof v === "string" && v.length > 0 && v.length <= max;
		if (!text(data?.g, 60) || !text(data?.r, 60) || !text(data?.e, 80)) return null;
		return {
			e: data.e,
			g: data.g,
			r: data.r,
			...(text(data.b, 40) ? { b: data.b } : {}),
			...(text(data.d, 40) ? { d: data.d } : {}),
		};
	} catch {
		return null;
	}
}
