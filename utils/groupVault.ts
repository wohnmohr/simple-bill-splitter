/**
 * End-to-end encryption for synced groups.
 *
 * A group is one random 256-bit secret, carried only in the link's #fragment
 * (browsers never send the fragment to a server). Everything else is derived
 * from it with HKDF, so each value does one job and none reveals another:
 *
 *   secret ──HKDF "id"────► lookup id     the only thing the server can index by
 *     │ (+ passphrase, PBKDF2 600k)
 *     └──HKDF "enc"───────► AES-256-GCM key   never leaves the device
 *        HKDF "auth"──────► write token       the server keeps only its SHA-256
 *        HKDF "safety"────► safety code       compare it to spot a swapped link
 *
 * Blobs are padded to fixed size buckets before encryption, so the server
 * can't tell a ₹50 chai from a 40-person trip by ciphertext length, and every
 * blob is bound to its group and record kind as associated data, so the
 * server can't move ciphertext between groups or pass a snapshot off as an
 * update.
 *
 * An optional passphrase is mixed in with PBKDF2 (600,000 rounds, OWASP's
 * figure for SHA-256): a leaked link alone then opens nothing, and the server
 * can't check guesses because it never sees anything derived from the
 * passphrase except the token hash.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

const V = "splitbiller/g/v1";
export const GROUP_SECRET_RE = /^[A-Za-z0-9_-]{43}$/;
/** Fragment prefix for groups that also need a passphrase. */
const PASS_PREFIX = "p.";
const PBKDF2_ROUNDS = 600_000;

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
const concat = (...parts: Uint8Array[]) => {
	const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
	let at = 0;
	for (const p of parts) {
		out.set(p, at);
		at += p.length;
	}
	return out;
};

/** A fresh group secret: 256 random bits. */
export const newGroupSecret = () => toB64u(random(32));

/** What the #fragment of a group link carries. */
export type GroupLink = { secret: string; needsPassphrase: boolean };

export const linkFragment = (secret: string, needsPassphrase: boolean) => (needsPassphrase ? PASS_PREFIX : "") + secret;

export function parseGroupFragment(fragment: string): GroupLink | null {
	const raw = fragment.replace(/^#/, "");
	const needsPassphrase = raw.startsWith(PASS_PREFIX);
	const secret = needsPassphrase ? raw.slice(PASS_PREFIX.length) : raw;
	return GROUP_SECRET_RE.test(secret) ? { secret, needsPassphrase } : null;
}

async function hkdf(ikm: Uint8Array, info: string, bytes: number): Promise<Uint8Array> {
	const base = await crypto.subtle.importKey("raw", buf(ikm), "HKDF", false, ["deriveBits"]);
	const bits = await crypto.subtle.deriveBits(
		{ name: "HKDF", hash: "SHA-256", salt: buf(enc.encode(V)), info: buf(enc.encode(info)) },
		base,
		bytes * 8
	);
	return new Uint8Array(bits);
}

/**
 * Stretches a passphrase into 32 bytes, salted with the group secret so the
 * same passphrase gives unrelated keys in different groups. Slow on purpose
 * (about a second on a phone); the result is kept on the device afterwards.
 */
export async function stretchPassphrase(secret: string, passphrase: string): Promise<string> {
	const base = await crypto.subtle.importKey("raw", buf(enc.encode(passphrase.normalize("NFKC"))), "PBKDF2", false, ["deriveBits"]);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", hash: "SHA-256", iterations: PBKDF2_ROUNDS, salt: buf(concat(enc.encode(`${V}/pass`), fromB64u(secret))) },
		base,
		256
	);
	return toB64u(new Uint8Array(bits));
}

export type GroupKeys = {
	/** Lookup id the server stores rows under (128-bit, from the secret alone). */
	id: string;
	/** Proof of membership for the API; the server stores only its hash. */
	token: string;
	/** Short code everyone in the group sees; different code = different key. */
	safetyCode: string;
	key: CryptoKey;
};

/** Derives every per-group value from the link secret (and stretched passphrase, if the group has one). */
export async function deriveGroupKeys(secret: string, stretched?: string): Promise<GroupKeys> {
	const s = fromB64u(secret);
	const ikm = stretched ? concat(s, fromB64u(stretched)) : s;
	const [id, keyBytes, token, safety] = await Promise.all([
		hkdf(s, "id", 16),
		hkdf(ikm, "enc", 32),
		hkdf(ikm, "auth", 32),
		hkdf(ikm, "safety", 5),
	]);
	const key = await crypto.subtle.importKey("raw", buf(keyBytes), "AES-GCM", false, ["encrypt", "decrypt"]);
	keyBytes.fill(0);
	return { id: toB64u(id), token: toB64u(token), safetyCode: emojiCode(safety), key };
}

// 64 emoji that look distinct at a glance; 6 bits each, so 5 emoji = 30 bits.
const EMOJI = [..."🍎🍌🍇🍉🍋🍒🥕🌽🍄🥥🍕🍩🍪🧁🍿🥨🐶🐱🦊🐻🐼🐯🦁🐮🐷🐸🐵🐔🐧🦉🦋🐢🐙🦀🐬🐳🌵🌲🌻🌸🍀🌙⭐🔥🌈❄️⚡🎈🎁🎸🎲🚲🚀⛵🚗🏠⏰💡🔑🧲📚✏️🎩👟"].filter((c) => c !== "️");

function emojiCode(bytes: Uint8Array): string {
	// 5 bytes = 40 bits, exact in a double; the top 30 bits pick 5 emoji.
	const value = bytes.reduce((n, b) => n * 256 + b, 0);
	const out: string[] = [];
	for (let i = 0; i < 5; i++) out.push(EMOJI[Math.floor(value / 2 ** (34 - i * 6)) % 64]);
	return out.join(" ");
}

export type BlobKind = "ops" | "snapshot";
const aad = (id: string, kind: BlobKind) => buf(enc.encode(`${V}/${id}/${kind}`));

/** Size buckets: 512 B, then doubling to 64 KB, then whole 64 KB steps. */
function paddedLength(n: number): number {
	if (n <= 512) return 512;
	if (n <= 65536) return 2 ** Math.ceil(Math.log2(n));
	return Math.ceil(n / 65536) * 65536;
}

/** Encrypts `data` for a group; returns base64url(iv ‖ ciphertext of padded plaintext). */
export async function sealGroup(keys: GroupKeys, kind: BlobKind, data: unknown): Promise<string> {
	const body = enc.encode(JSON.stringify(data));
	const plain = new Uint8Array(paddedLength(body.length + 4));
	new DataView(plain.buffer).setUint32(0, body.length);
	plain.set(body, 4);
	const iv = random(12);
	const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: buf(iv), additionalData: aad(keys.id, kind) }, keys.key, buf(plain)));
	return toB64u(concat(iv, ct));
}

/** Decrypts a sealed blob; null if the key is wrong or anything was tampered with. */
export async function openGroup(keys: GroupKeys, kind: BlobKind, blob: string): Promise<unknown | null> {
	try {
		const bytes = fromB64u(blob);
		const plain = new Uint8Array(
			await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf(bytes.slice(0, 12)), additionalData: aad(keys.id, kind) }, keys.key, buf(bytes.slice(12)))
		);
		const length = new DataView(plain.buffer).getUint32(0);
		if (length > plain.length - 4) return null;
		return JSON.parse(dec.decode(plain.subarray(4, 4 + length)));
	} catch {
		return null;
	}
}
