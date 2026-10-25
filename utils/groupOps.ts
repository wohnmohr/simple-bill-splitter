/**
 * The shared state of a synced group, as a conflict-free replicated data type.
 *
 * Every change is an operation on one entity: a member, an expense, or a group
 * setting. For each entity the operation with the highest (clock, op id) wins,
 * and a delete is just an operation whose value is null. An edit names the
 * fields it changed, and each of those fields keeps its own latest edit, so two
 * phones editing different fields of one expense both keep their change. An
 * edit never brings back a deleted entity. Merging is therefore
 * commutative, associative and idempotent: any devices that have seen the same
 * operations show the same group, whatever order they arrived in. The server
 * can delay or withhold operations, but it can't change the result by
 * reordering or replaying them.
 *
 * Values from other devices are untrusted input and are validated before use.
 */
import { CURRENCIES, DEFAULT_CURRENCY } from "@/constants";
import type { Currency, Expense, ExpenseComment, Group, Person } from "@/types";
import { isMonthKey } from "@/utils/recurring";
import { cleanText } from "@/utils/text";
import { isThemeId } from "@/utils/themes";

/** Members, expenses, comments, group settings. */
export type EntityKind = "m" | "e" | "c" | "g";
/**
 * One change. `v: null` deletes the entity. An edit lists the fields it changed in `f`; `v` still holds the
 * whole value, which is all that older app versions read.
 */
export type Op = { i: string; t: number; k: EntityKind; e: string; v: unknown; f?: string[] };
type Edit = { t: number; i: string; v: unknown };
/** `t`/`i` is the last whole write; `f` keeps later edits by field, already laid over `v`. */
type Cell = { t: number; i: string; v: unknown; c: number; f?: Record<string, Edit> };
export type SyncState = Record<EntityKind, Record<string, Cell>>;

export const emptyState = (): SyncState => ({ m: {}, e: {}, c: {}, g: {} });

const KINDS: EntityKind[] = ["m", "e", "c", "g"];
const wins = (a: { t: number; i: string }, b: { t: number; i: string }) => a.t > b.t || (a.t === b.t && a.i > b.i);

export const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const FIELD_RE = /^[A-Za-z]{1,32}$/;
const isOp = (o: unknown): o is Op => {
	const op = o as Op;
	return (
		!!op &&
		typeof op.i === "string" && ID_RE.test(op.i) &&
		Number.isInteger(op.t) && op.t > 0 &&
		KINDS.includes(op.k) &&
		typeof op.e === "string" && ID_RE.test(op.e) &&
		(op.f === undefined || (Array.isArray(op.f) && op.f.length <= 32 && op.f.every((x) => typeof x === "string" && FIELD_RE.test(x))))
	);
};

/** Clocks are wall-clock milliseconds. One further ahead than this came from a broken or hostile device. */
const MAX_SKEW = 7 * 24 * 60 * 60 * 1000;
const clockLimit = () => Date.now() + MAX_SKEW;
/**
 * Such an op sorts below every real one instead, so it can't win every later edit or push new clocks past
 * safe integers (which other devices would drop). Its new entity, if any, still arrives.
 */
const sane = (op: Op): Op => (op.t > clockLimit() ? { ...op, t: 1 } : op);

/** Expense fields that must agree with each other (splits add up to the amount), so they merge as one. */
const SPLIT = new Set(["amount", "paidBy", "payers", "participants", "splitMethod", "percentages", "amounts", "shares"]);
const fieldOf = (k: EntityKind, key: string) => (k === "e" && SPLIT.has(key) ? "split" : key);
const entries = (v: unknown) => (v && typeof v === "object" ? Object.entries(v) : []);
const part = (k: EntityKind, v: unknown, field: string) => Object.fromEntries(entries(v).filter(([key]) => fieldOf(k, key) === field));
/** `v` with each field's latest edit laid over it. */
const overlay = (k: EntityKind, v: unknown, f: Cell["f"]) =>
	v === null || !f
		? v
		: Object.fromEntries([...entries(v).filter(([key]) => !Object.hasOwn(f, fieldOf(k, key))), ...Object.values(f).flatMap((x) => entries(x.v))]);

/** Applies one operation in place. Safe to repeat and to apply in any order. */
export function applyOp(state: SyncState, op: Op): void {
	const table = state[op.k];
	const cell = table[op.e];
	if (cell && op.f) {
		let f = cell.f;
		for (const field of op.f) {
			if (wins(op, f && Object.hasOwn(f, field) ? f[field] : cell)) f = { ...f, [field]: { t: op.t, i: op.i, v: part(op.k, op.v, field) } };
		}
		if (f !== cell.f) Object.assign(cell, { f, v: overlay(op.k, cell.v, f) });
		if (op.t < cell.c) cell.c = op.t;
	} else if (!cell || wins(op, cell)) {
		// A whole write (new entity, delete, or an edit from an older app version) replaces older field edits.
		const kept = Object.entries(cell?.f ?? {}).filter(([, x]) => wins(x, op));
		const f = kept.length ? Object.fromEntries(kept) : undefined;
		table[op.e] = { t: op.t, i: op.i, v: overlay(op.k, op.v ?? null, f), c: Math.min(cell?.c ?? op.t, op.t), ...(f ? { f } : {}) };
	} else if (op.t < cell.c) cell.c = op.t;
}

/** Applies untrusted operations, skipping malformed ones. */
export function applyOps(state: SyncState, ops: unknown): void {
	if (!Array.isArray(ops)) return;
	for (const op of ops) if (isOp(op)) applyOp(state, sane(op));
}

/** Merges a snapshot (another state) into `state`. */
export function mergeState(state: SyncState, other: unknown): void {
	const o = other as Partial<SyncState> | null;
	if (!o || typeof o !== "object") return;
	for (const k of KINDS) {
		const table = o[k];
		if (!table || typeof table !== "object") continue;
		for (const [e, cell] of Object.entries(table)) {
			if (!cell || typeof cell !== "object") continue;
			const op = { i: cell.i, t: cell.t, k, e, v: cell.v };
			if (!isOp(op)) continue;
			applyOp(state, sane(op));
			if (Number.isSafeInteger(cell.c) && cell.c > 0 && cell.c < state[k][e].c) state[k][e].c = cell.c;
			for (const [field, x] of entries(cell.f)) {
				const edit = { i: x?.i, t: x?.t, k, e, v: x?.v, f: [field] };
				if (isOp(edit)) applyOp(state, sane(edit));
			}
		}
	}
}

/** Two queues of unconfirmed changes as one (two tabs of one device), less what `state` already has from the server. */
export function joinPending(state: SyncState, mine: Op[], theirs: Op[]): Op[] {
	const queued = new Set(mine.map((o) => o.i));
	return [...mine, ...theirs.filter((o) => !queued.has(o.i))].filter((o) => state[o.k][o.e]?.i !== o.i);
}

export const cloneState = (s: SyncState): SyncState => JSON.parse(JSON.stringify(s));

/** Highest clock seen, so new operations always sort after everything this device knows. */
export const maxClock = (s: SyncState) =>
	Math.max(0, ...KINDS.flatMap((k) => Object.values(s[k]).flatMap((c) => [c.t, ...Object.values(c.f ?? {}).map((x) => x.t)])));

/** The clock new operations start after: the highest seen, but never one from too far ahead. */
export const nextClock = (s: SyncState, pending: Op[]) => Math.min(Math.max(maxClock(s), ...pending.map((o) => o.t)), clockLimit());

/** `s` with clocks from too far ahead (saved before they were checked) sorted last, as every device now does. */
export function repairClocks(s: SyncState): SyncState {
	if (maxClock(s) <= clockLimit()) return s;
	const fixed = emptyState();
	mergeState(fixed, s);
	return fixed;
}

/** Most ops in one push, however small. */
const MAX_OPS_PER_PUSH = 200;
/** Largest batch JSON that still seals into the 64 KB bucket, which fits under the server's MAX_OPS_BLOB. */
export const MAX_PUSH_BYTES = 65535;

const jsonBytes = (v: unknown) => new TextEncoder().encode(JSON.stringify(v)).length;

/** The queued ops for the next push: as many as fit in one request. Empty only when the first op alone is too big. */
export function pushBatch(pending: Op[]): Op[] {
	let bytes = jsonBytes({ ops: [] });
	let count = 0;
	for (const op of pending.slice(0, MAX_OPS_PER_PUSH)) {
		bytes += jsonBytes(op) + (count ? 1 : 0); // ops after the first add a comma
		if (bytes > MAX_PUSH_BYTES) break;
		count++;
	}
	return pending.slice(0, count);
}

// ── Untrusted values → app types ──────────────────────────────

/** The biggest amount one entry can hold (₹9,99,99,99,999.99), on every device. */
export const MAX_AMOUNT = 9_999_999_999.99;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const money = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 && v <= MAX_AMOUNT ? Math.round(v * 100) / 100 : 0);
/** Whole paise, so sums compare exactly. */
const paise = (n: number) => Math.round(n * 100);

export function toPerson(id: string, v: unknown): Person | null {
	const p = v as Partial<Person>;
	const name = cleanText(str(p?.name, 200), 60);
	if (!name) return null;
	const person: Person = { id, name };
	const upiId = str(p.upiId, 80).trim();
	if (upiId) person.upiId = upiId;
	if (p.joined === true) person.joined = true;
	if (p.left === true) person.left = true;
	return person;
}

/** Most shares one person can hold in a split by shares. */
export const MAX_SHARES = 1000;

export function toExpense(id: string, v: unknown, members: Set<string>): Expense | null {
	const x = v as Partial<Expense>;
	const amount = money(x?.amount);
	const paidBy = str(x?.paidBy, 64);
	const participants = Array.isArray(x?.participants) ? [...new Set(x.participants.map((p) => str(p, 64)))].filter((p) => members.has(p)) : [];
	// A member deleted on another device takes their entries with them.
	if (!amount || !members.has(paidBy) || participants.length === 0) return null;
	const splitMethod = x.splitMethod === "percentage" || x.splitMethod === "exact" ? x.splitMethod : "equally";
	const expense: Expense = { id, amount, paidBy, participants, splitMethod };
	const description = cleanText(str(x.description, 400), 200);
	if (description) expense.description = description;
	if (x.kind === "payment") expense.kind = "payment";
	if (Number.isSafeInteger(x.createdAt) && (x.createdAt as number) > 0) expense.createdAt = x.createdAt;
	if (!expense.kind && isMonthKey(x.repeat?.next)) expense.repeat = { next: x.repeat.next };
	const payers = x.payers && typeof x.payers === "object" ? Object.entries(x.payers as Record<string, unknown>) : [];
	if (payers.length > 1 && !expense.kind) {
		if (payers.some(([p]) => !members.has(p))) return null;
		// Kept only when every part is a real amount and they add up to what was spent.
		const parts = payers.map(([p, n]) => [p, money(n)] as const);
		if (parts.every(([, n]) => n > 0) && parts.reduce((s, [, n]) => s + paise(n), 0) === paise(amount)) {
			expense.payers = Object.fromEntries(parts);
		}
	}
	// Percentages run 0–100; exact amounts can't exceed what was spent.
	const field = splitMethod === "percentage" ? "percentages" : splitMethod === "exact" ? "amounts" : null;
	const raw = field && x[field];
	if (field && raw && typeof raw === "object") {
		const max = field === "percentages" ? 100 : amount;
		const weights: Record<string, number> = {};
		for (const p of participants) {
			const n = (raw as Record<string, unknown>)[p];
			if (typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= max) weights[p] = n;
		}
		expense[field] = weights;
	}
	// Shares (2:1:1) only label an exact split, so they're kept only when every participant has one.
	const shares = splitMethod === "exact" && x.shares && typeof x.shares === "object" ? (x.shares as Record<string, unknown>) : null;
	if (shares && participants.every((p) => typeof shares[p] === "number" && (shares[p] as number) > 0 && (shares[p] as number) <= MAX_SHARES)) {
		expense.shares = Object.fromEntries(participants.map((p) => [p, shares[p] as number]));
	}
	return expense;
}

export const MAX_COMMENT = 500;

function toComment(id: string, v: unknown, expenses: Set<string>, members: Set<string>): ExpenseComment | null {
	const x = v as Partial<ExpenseComment>;
	const expenseId = str(x?.expenseId, 64);
	const text = cleanText(str(x?.text, MAX_COMMENT), MAX_COMMENT);
	if (!expenses.has(expenseId) || !text || !Number.isSafeInteger(x.at) || (x.at as number) <= 0) return null;
	const by = str(x.by, 64);
	return { id, expenseId, text, at: x.at as number, ...(members.has(by) ? { by } : {}) };
}

const toCurrency = (v: unknown): Currency => CURRENCIES.find((c) => c.code === (v as Currency | null)?.code) ?? DEFAULT_CURRENCY;

const live = (table: Record<string, Cell>) =>
	Object.entries(table)
		.filter(([, c]) => c.v !== null)
		.sort(([a, x], [b, y]) => x.c - y.c || (a < b ? -1 : 1));

/** The group this state describes. Device-only fields (local id, "who am I", sync link, nicknames, host, UPI changes seen) come from `local`. */
export function materialize(state: SyncState, local: Pick<Group, "id" | "meId" | "sync" | "nicknames" | "hosted" | "upiChangedAt">): Group {
	const members = live(state.m).map(([id, c]) => toPerson(id, c.v)).filter((p): p is Person => !!p);
	const ids = new Set(members.map((m) => m.id));
	const expenses = live(state.e)
		.map(([id, c]) => toExpense(id, c.v, ids))
		.filter((x): x is Expense => !!x);
	const expenseIds = new Set(expenses.map((x) => x.id));
	const comments = live(state.c)
		.map(([id, c]) => toComment(id, c.v, expenseIds, ids))
		.filter((x): x is ExpenseComment => !!x)
		.sort((a, b) => a.at - b.at);
	return {
		id: local.id,
		name: cleanText(str(state.g.name?.v, 200), 60) || "Shared group",
		members,
		expenses,
		...(comments.length ? { comments } : {}),
		currency: toCurrency(state.g.currency?.v),
		...(isThemeId(state.g.theme?.v) ? { theme: state.g.theme.v as string } : {}),
		...(typeof state.g.host?.v === "string" && ids.has(state.g.host.v) ? { hostId: state.g.host.v } : {}),
		...(Number.isSafeInteger(state.g.closed?.v) && (state.g.closed.v as number) > 0 ? { closedAt: state.g.closed.v as number } : {}),
		...(local.meId !== undefined ? { meId: local.meId } : {}),
		...(local.sync ? { sync: local.sync } : {}),
		...(local.nicknames ? { nicknames: local.nicknames } : {}),
		...(local.hosted !== undefined ? { hosted: local.hosted } : {}),
		...(local.upiChangedAt ? { upiChangedAt: local.upiChangedAt } : {}),
	};
}

// ── Local edits → operations ──────────────────────────────────

type Change = Omit<Op, "i" | "t">;
/** JSON with sorted keys, so key order never reads as an edit (a false edit could overwrite someone else's). */
const canon = (v: unknown): string =>
	Array.isArray(v)
		? `[${v.map(canon).join(",")}]`
		: v && typeof v === "object"
			? `{${Object.keys(v as object)
					.filter((k) => (v as Record<string, unknown>)[k] !== undefined)
					.sort()
					.map((k) => `${JSON.stringify(k)}:${canon((v as Record<string, unknown>)[k])}`)
					.join(",")}}`
			: JSON.stringify(v);
const same = (a: unknown, b: unknown) => canon(a) === canon(b);

function diffTable<T extends { id: string }>(k: EntityKind, before: T[], after: T[], out: Change[]) {
	const prev = new Map(before.map((x) => [x.id, x]));
	for (const x of after) {
		if (!ID_RE.test(x.id)) continue;
		const { id, ...v } = x;
		const old = prev.get(id) as Record<string, unknown> | undefined;
		prev.delete(id);
		if (!old) {
			out.push({ k, e: id, v });
			continue;
		}
		const f = new Set(Object.keys({ ...old, ...v }).filter((key) => key !== "id" && !same(old[key], (v as Record<string, unknown>)[key])).map((key) => fieldOf(k, key)));
		if (f.size) out.push({ k, e: id, v, f: [...f] });
	}
	for (const id of prev.keys()) if (ID_RE.test(id)) out.push({ k, e: id, v: null });
}

/** What changed between two versions of a group, as entity-level changes. */
export function diffGroup(before: Group, after: Group): Change[] {
	const out: Change[] = [];
	if (before.name !== after.name) out.push({ k: "g", e: "name", v: after.name });
	if (before.currency.code !== after.currency.code) out.push({ k: "g", e: "currency", v: { code: after.currency.code } });
	if ((before.theme ?? null) !== (after.theme ?? null)) out.push({ k: "g", e: "theme", v: after.theme ?? null });
	if ((before.closedAt ?? null) !== (after.closedAt ?? null)) out.push({ k: "g", e: "closed", v: after.closedAt ?? null });
	if (!before.hostId && after.hostId) out.push({ k: "g", e: "host", v: after.hostId });
	diffTable("m", before.members, after.members, out);
	diffTable("e", before.expenses, after.expenses, out);
	diffTable("c", before.comments ?? [], after.comments ?? [], out);
	return out;
}

/** Every entity of a group as changes, for the first upload. */
export const groupAsChanges = (g: Group): Change[] => diffGroup({ ...g, name: "", currency: { code: "", symbol: "", name: "" }, theme: undefined, closedAt: undefined, hostId: undefined, members: [], expenses: [], comments: [] }, g);

/** The parts of a group that are shared with everyone (device-only fields stripped). */
export const sharedView = (g: Group) => canon([g.name, g.currency.code, g.theme ?? null, g.closedAt ?? null, g.members, g.expenses, g.comments ?? []]);
