/**
 * End-to-end encryption for synced groups, built on libsodium (the audited
 * NaCl library behind Threema, Wire and others). Nothing here is
 * hand-rolled cryptography: every primitive is a libsodium call, and this
 * file only decides which one does which job.
 *
 * A group is one random 256-bit secret, carried only in the link's #fragment
 * (browsers never send the fragment to a server). Everything else is derived
 * from it with crypto_kdf (BLAKE2b), so each value does one job and none
 * reveals another:
 *
 *   secret ──kdf #1──────────► lookup id     the only thing the server can index by
 *     │ (+ passphrase via Argon2id)
 *     └──► root ──kdf #2──► XChaCha20-Poly1305 key   never leaves the device
 *               ──kdf #3──► write token              the server keeps only its SHA-256
 *               ──kdf #4──► safety code              compare it to spot a swapped link
 *
 * Every blob is padded (sodium_pad) to a fixed size bucket before encryption,
 * so the server can't tell a ₹50 chai from a 40-person trip by length, and is
 * bound to its group and record kind as associated data, so the server can't
 * move ciphertext between groups or pass a snapshot off as an update.
 * XChaCha20's 192-bit random nonces are safe to pick at random forever.
 *
 * An optional passphrase is stretched with Argon2id (memory-hard, so GPU
 * guessing is expensive) and salted per group: a leaked link alone then opens
 * nothing, and the server can't test guesses.
 *
 * libsodium is loaded on first use, so pages without groups never download it.
 */
import type _sodium from "libsodium-wrappers-sumo";

type Sodium = typeof _sodium;
let loading: Promise<Sodium> | null = null;
const sodium = (): Promise<Sodium> =>
	(loading ??= import("libsodium-wrappers-sumo")
		.then(async (m) => {
			const s = (m.default ?? m) as Sodium;
			await s.ready;
			return s;
		})
		.catch((err) => {
			// A failed download (flaky network) must not stick: the next call tries again.
			loading = null;
			throw err;
		}));

/** Format version, first byte of every blob, so the scheme can change later without breaking old groups. */
const VERSION = 2;
const KDF_CONTEXT = "sbgrp_v2"; // crypto_kdf contexts are exactly 8 bytes
const SUBKEY = { id: 1, enc: 2, auth: 3, safety: 4 } as const;
const AD_PREFIX = "splitbiller/g/v2";

export const GROUP_SECRET_RE = /^[A-Za-z0-9_-]{43}$/;
/** Fragment prefix for groups that also need a passphrase. */
const PASS_PREFIX = "p.";

// Plain base64url, for ids and links (encoding, not cryptography).
export const toB64u = (bytes: Uint8Array) => {
	let bin = "";
	bytes.forEach((b) => (bin += String.fromCharCode(b)));
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const fromB64u = (value: string) => {
	const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
	return Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
};

const concat = (...parts: Uint8Array[]) => {
	const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
	let at = 0;
	for (const p of parts) {
		out.set(p, at);
		at += p.length;
	}
	return out;
};

/** A fresh group secret: 256 bits from libsodium's CSPRNG. */
export async function newGroupSecret(): Promise<string> {
	const s = await sodium();
	return toB64u(s.randombytes_buf(s.crypto_kdf_KEYBYTES));
}

/** What the #fragment of a group link carries. */
/**
 * What a group link's #fragment holds: the secret, a "p." prefix when the
 * group also needs a passphrase, and, on someone's personal link, "~" and
 * their member id, so their other devices open the group as them instead of
 * joining again. The fragment never reaches the server.
 */
export type GroupLink = { secret: string; needsPassphrase: boolean; me?: string };

const MEMBER_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export const linkFragment = (secret: string, needsPassphrase: boolean, me?: string) =>
	(needsPassphrase ? PASS_PREFIX : "") + secret + (me ? `~${me}` : "");

export function parseGroupFragment(fragment: string): GroupLink | null {
	const [raw, me] = fragment.replace(/^#/, "").split("~");
	const needsPassphrase = raw.startsWith(PASS_PREFIX);
	const secret = needsPassphrase ? raw.slice(PASS_PREFIX.length) : raw;
	if (!GROUP_SECRET_RE.test(secret)) return null;
	return me && MEMBER_ID_RE.test(me) ? { secret, needsPassphrase, me } : { secret, needsPassphrase };
}

/**
 * Stretches a passphrase with Argon2id (libsodium's interactive limits: 64 MB,
 * 2 passes), salted with the group secret so the same passphrase gives
 * unrelated keys in different groups. The result is kept on the device so the
 * passphrase is asked for only once.
 */
export async function stretchPassphrase(secret: string, passphrase: string): Promise<string> {
	const s = await sodium();
	const salt = s.crypto_generichash(s.crypto_pwhash_SALTBYTES, concat(new TextEncoder().encode(`${AD_PREFIX}/pass`), fromB64u(secret)), null);
	const out = s.crypto_pwhash(
		32,
		passphrase.normalize("NFKC"),
		salt,
		s.crypto_pwhash_OPSLIMIT_INTERACTIVE,
		s.crypto_pwhash_MEMLIMIT_INTERACTIVE,
		s.crypto_pwhash_ALG_ARGON2ID13
	);
	return toB64u(out);
}

export type GroupKeys = {
	/** Lookup id the server stores rows under (128-bit, from the secret alone). */
	id: string;
	/** Proof of membership for the API; the server stores only its hash. */
	token: string;
	/** Short code everyone in the group sees; different code = different key. */
	safetyCode: string;
	key: Uint8Array;
};

/** Derives every per-group value from the link secret (and stretched passphrase, if the group has one). */
export async function deriveGroupKeys(secret: string, stretched?: string): Promise<GroupKeys> {
	const s = await sodium();
	const master = fromB64u(secret);
	// With a passphrase, everything secret comes from a root that needs both;
	// the lookup id never does, so the server can find the group either way.
	const root = stretched ? s.crypto_generichash(s.crypto_kdf_KEYBYTES, fromB64u(stretched), master) : master;
	const id = s.crypto_kdf_derive_from_key(16, SUBKEY.id, KDF_CONTEXT, master);
	const key = s.crypto_kdf_derive_from_key(s.crypto_aead_xchacha20poly1305_ietf_KEYBYTES, SUBKEY.enc, KDF_CONTEXT, root);
	const token = s.crypto_kdf_derive_from_key(32, SUBKEY.auth, KDF_CONTEXT, root);
	const safety = s.crypto_kdf_derive_from_key(16, SUBKEY.safety, KDF_CONTEXT, root);
	const keys = { id: toB64u(id), token: toB64u(token), safetyCode: emojiCode(safety), key };
	s.memzero(token);
	s.memzero(safety);
	if (root !== master) s.memzero(root);
	s.memzero(master);
	return keys;
}

// 64 emoji that look distinct at a glance; 6 bits each, so 5 emoji = 30 bits.
const EMOJI = [..."🍎🍌🍇🍉🍋🍒🥕🌽🍄🥥🍕🍩🍪🧁🍿🥨🐶🐱🦊🐻🐼🐯🦁🐮🐷🐸🐵🐔🐧🦉🦋🐢🐙🦀🐬🐳🌵🌲🌻🌸🍀🌙⭐🔥🌈❄️⚡🎈🎁🎸🎲🚲🚀⛵🚗🏠⏰💡🔑🧲📚✏️🎩👟"].filter((c) => c !== "️");

function emojiCode(bytes: Uint8Array): string {
	// The first 5 bytes = 40 bits, exact in a double; the top 30 bits pick 5 emoji.
	const value = Array.from(bytes.subarray(0, 5)).reduce((n, b) => n * 256 + b, 0);
	const out: string[] = [];
	for (let i = 0; i < 5; i++) out.push(EMOJI[Math.floor(value / 2 ** (34 - i * 6)) % 64]);
	return out.join(" ");
}

/** "backup" is a device's own groups list (utils/groupBackup); bound into the ciphertext, so it can never pass for a group. */
export type BlobKind = "ops" | "snapshot" | "backup";
const ad = (id: string, kind: BlobKind) => new TextEncoder().encode(`${AD_PREFIX}/${id}/${kind}`);

/** Size buckets: 512 B, then doubling to 64 KB, then whole 64 KB steps. */
function bucket(n: number): number {
	if (n <= 512) return 512;
	if (n <= 65536) return 2 ** Math.ceil(Math.log2(n));
	return Math.ceil(n / 65536) * 65536;
}

/** Encrypts `data` for a group: version ‖ nonce ‖ XChaCha20-Poly1305(padded JSON), base64url. */
export async function sealGroup(keys: GroupKeys, kind: BlobKind, data: unknown): Promise<string> {
	const s = await sodium();
	const body = s.from_string(JSON.stringify(data));
	// sodium_pad always adds at least one byte, so the bucket must exceed the body.
	const padded = s.pad(body, bucket(body.length + 1));
	const nonce = s.randombytes_buf(s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
	const ct = s.crypto_aead_xchacha20poly1305_ietf_encrypt(padded, ad(keys.id, kind), null, nonce, keys.key);
	return toB64u(concat(Uint8Array.of(VERSION), nonce, ct));
}

/** Decrypts a sealed blob; null if the key is wrong, the version is unknown, or anything was tampered with. */
export async function openGroup(keys: GroupKeys, kind: BlobKind, blob: string): Promise<unknown | null> {
	try {
		const s = await sodium();
		const bytes = fromB64u(blob);
		const n = s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
		if (bytes[0] !== VERSION || bytes.length < 1 + n + s.crypto_aead_xchacha20poly1305_ietf_ABYTES) return null;
		const padded = s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, bytes.subarray(1 + n), ad(keys.id, kind), bytes.subarray(1, 1 + n), keys.key);
		return JSON.parse(s.to_string(s.unpad(padded, padded.length)));
	} catch {
		return null;
	}
}
