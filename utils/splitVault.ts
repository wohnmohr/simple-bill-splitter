/**
 * End-to-end encryption for cloud splits.
 *
 * Each split gets a random 256-bit key that lives only in the link's #fragment,
 * which browsers never send to a server. The split and every payment are sealed
 * with AES-256-GCM before upload, bound to the split id (and record type) as
 * additional authenticated data, so the server stores ciphertext it cannot read
 * and blobs cannot be swapped between splits.
 *
 * Writes carry a token derived one-way from the key; the server keeps only a
 * hash of that token, so it can check "this person has the link" without ever
 * learning the key.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

export const SPLIT_ID_RE = /^[A-Za-z0-9_-]{22}$/;
export const SPLIT_KEY_RE = /^[A-Za-z0-9_-]{43}$/;

export const toB64u = (bytes: Uint8Array) => {
	let bin = "";
	bytes.forEach((b) => (bin += String.fromCharCode(b)));
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const fromB64u = (value: string) => {
	const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
	return Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
};

const random = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const buf = (b: Uint8Array) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

/** A fresh split id (128-bit) and key (256-bit). */
export const newVault = () => ({ id: toB64u(random(16)), key: toB64u(random(32)) });

const importKey = (key: string) => crypto.subtle.importKey("raw", buf(fromB64u(key)), "AES-GCM", false, ["encrypt", "decrypt"]);

export type RecordKind = "split" | "payment" | "claim";
const aad = (id: string, kind: RecordKind) => buf(enc.encode(`splitbiller/v1/${id}/${kind}`));

/** Encrypts `data` for split `id`; returns base64url(iv ‖ ciphertext). */
export async function seal(key: string, id: string, kind: RecordKind, data: unknown): Promise<string> {
	const iv = random(12);
	const ct = new Uint8Array(
		await crypto.subtle.encrypt({ name: "AES-GCM", iv: buf(iv), additionalData: aad(id, kind) }, await importKey(key), buf(enc.encode(JSON.stringify(data))))
	);
	const out = new Uint8Array(iv.length + ct.length);
	out.set(iv);
	out.set(ct, iv.length);
	return toB64u(out);
}

/** Decrypts a sealed blob; null if the key is wrong or the blob was tampered with. */
export async function open(key: string, id: string, kind: RecordKind, blob: string): Promise<unknown | null> {
	try {
		const bytes = fromB64u(blob);
		const pt = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: buf(bytes.slice(0, 12)), additionalData: aad(id, kind) },
			await importKey(key),
			buf(bytes.slice(12))
		);
		return JSON.parse(dec.decode(pt));
	} catch {
		return null;
	}
}

/** Proof of holding the link, derived one-way from the key. */
export async function writeToken(key: string): Promise<string> {
	const material = new Uint8Array([...enc.encode("splitbiller/v1/write"), ...fromB64u(key)]);
	return toB64u(new Uint8Array(await crypto.subtle.digest("SHA-256", buf(material))));
}
