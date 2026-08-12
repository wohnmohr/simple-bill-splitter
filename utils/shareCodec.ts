import { CURRENCIES } from "@/constants";
import { Currency, Expense, Person } from "@/types";
import { CompactSharePayload, ShareSnapshot } from "@/types/share";

const SHARE_PREFIX = "sb1";
const SHARE_PATH = "/share";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/");
	const padLength = (4 - (padded.length % 4)) % 4;
	const base64 = padded + "=".repeat(padLength);
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

/** Ensures a contiguous ArrayBuffer view for Web Crypto typings. */
function asBufferSource(bytes: Uint8Array): BufferSource {
	return bytes.buffer.slice(
		bytes.byteOffset,
		bytes.byteOffset + bytes.byteLength
	) as ArrayBuffer;
}

async function compress(data: Uint8Array): Promise<Uint8Array> {
	if (typeof CompressionStream === "undefined") {
		return data;
	}
	const stream = new Blob([data as BlobPart])
		.stream()
		.pipeThrough(new CompressionStream("deflate-raw"));
	const buffer = await new Response(stream).arrayBuffer();
	return new Uint8Array(buffer);
}

async function decompress(data: Uint8Array): Promise<Uint8Array> {
	if (typeof DecompressionStream === "undefined") {
		return data;
	}
	try {
		const stream = new Blob([data as BlobPart])
			.stream()
			.pipeThrough(new DecompressionStream("deflate-raw"));
		const buffer = await new Response(stream).arrayBuffer();
		return new Uint8Array(buffer);
	} catch {
		// Payload may be uncompressed (older browsers / fallback encode)
		return data;
	}
}

function toCompact(snapshot: ShareSnapshot): CompactSharePayload {
	return {
		v: 1,
		n: snapshot.name,
		c: snapshot.currency.code,
		m: snapshot.members.map((m) => ({ i: m.id, n: m.name })),
		e: snapshot.expenses.map((e) => {
			const item: CompactSharePayload["e"][number] = {
				a: e.amount,
				p: e.paidBy,
				t: e.participants,
			};
			if (e.description) item.d = e.description;
			if (e.splitMethod === "percentage") {
				item.s = "p";
				if (e.percentages) item.r = e.percentages;
			} else {
				item.s = "e";
			}
			return item;
		}),
	};
}

function fromCompact(payload: CompactSharePayload): ShareSnapshot {
	const currency: Currency =
		CURRENCIES.find((c) => c.code === payload.c) || CURRENCIES[0];

	const members: Person[] = payload.m.map((m) => ({
		id: m.i,
		name: m.n,
	}));

	const expenses: Expense[] = payload.e.map((e, index) => ({
		id: `shared-exp-${index}`,
		amount: e.a,
		paidBy: e.p,
		participants: e.t,
		description: e.d,
		splitMethod: e.s === "p" ? "percentage" : "equally",
		percentages: e.r,
	}));

	return {
		name: payload.n || "Shared split",
		currency,
		members,
		expenses,
	};
}

/**
 * Encrypts a split snapshot client-side and returns a shareable URL.
 * The encrypted payload lives in the URL hash so it never hits the server.
 */
export async function encodeShareUrl(
	snapshot: ShareSnapshot,
	origin?: string
): Promise<string> {
	const compact = toCompact(snapshot);
	const jsonBytes = textEncoder.encode(JSON.stringify(compact));
	const compressed = await compress(jsonBytes);

	const keyBytes = crypto.getRandomValues(new Uint8Array(32));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		asBufferSource(keyBytes),
		{ name: "AES-GCM" },
		false,
		["encrypt"]
	);

	const ciphertext = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: asBufferSource(iv) },
			cryptoKey,
			asBufferSource(compressed)
		)
	);

	const packed = new Uint8Array(iv.length + ciphertext.length);
	packed.set(iv, 0);
	packed.set(ciphertext, iv.length);

	const fragment = `${SHARE_PREFIX}.${toBase64Url(keyBytes)}.${toBase64Url(packed)}`;
	const base =
		origin ||
		(typeof window !== "undefined" ? window.location.origin : "https://splitbiller.com");

	return `${base}${SHARE_PATH}#${fragment}`;
}

/**
 * Decodes a share URL or raw hash fragment back into a split snapshot.
 */
export async function decodeShareUrl(urlOrHash: string): Promise<ShareSnapshot> {
	const hashIndex = urlOrHash.indexOf("#");
	const fragment =
		hashIndex >= 0 ? urlOrHash.slice(hashIndex + 1) : urlOrHash.replace(/^#/, "");

	const parts = fragment.split(".");
	if (parts.length !== 3 || parts[0] !== SHARE_PREFIX) {
		throw new Error("Invalid or unsupported share link");
	}

	const [, keyB64, packedB64] = parts;
	const keyBytes = fromBase64Url(keyB64);
	const packed = fromBase64Url(packedB64);

	if (keyBytes.length !== 32 || packed.length < 13) {
		throw new Error("Corrupt share link");
	}

	const iv = packed.slice(0, 12);
	const ciphertext = packed.slice(12);

	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		asBufferSource(keyBytes),
		{ name: "AES-GCM" },
		false,
		["decrypt"]
	);

	const decrypted = new Uint8Array(
		await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: asBufferSource(iv) },
			cryptoKey,
			asBufferSource(ciphertext)
		)
	);

	const decompressed = await decompress(decrypted);
	const json = textDecoder.decode(decompressed);
	const payload = JSON.parse(json) as CompactSharePayload;

	if (payload.v !== 1 || !Array.isArray(payload.m) || !Array.isArray(payload.e)) {
		throw new Error("Unsupported share format");
	}

	return fromCompact(payload);
}

export function buildShareSnapshot(input: {
	name: string;
	currency: Currency;
	members: Person[];
	expenses: Expense[];
}): ShareSnapshot {
	return {
		name: input.name,
		currency: input.currency,
		members: input.members,
		expenses: input.expenses,
	};
}
