/**
 * The shared state of a synced group, as a conflict-free replicated data type.
 *
 * Every change is an operation on one entity: a member, an expense, or a group
 * setting. For each entity the operation with the highest (clock, op id) wins,
 * and a delete is just an operation whose value is null. Merging is therefore
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
import { isThemeId } from "@/utils/themes";

/** Members, expenses, comments, group settings. */
export type EntityKind = "m" | "e" | "c" | "g";
/** One change. `v: null` deletes the entity. */
export type Op = { i: string; t: number; k: EntityKind; e: string; v: unknown };
type Cell = { t: number; i: string; v: unknown; c: number };
export type SyncState = Record<EntityKind, Record<string, Cell>>;

export const emptyState = (): SyncState => ({ m: {}, e: {}, c: {}, g: {} });

const KINDS: EntityKind[] = ["m", "e", "c", "g"];
const wins = (a: { t: number; i: string }, b: { t: number; i: string }) => a.t > b.t || (a.t === b.t && a.i > b.i);

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const isOp = (o: unknown): o is Op => {
	const op = o as Op;
	return (
		!!op &&
		typeof op.i === "string" && ID_RE.test(op.i) &&
		Number.isSafeInteger(op.t) && op.t > 0 &&
		KINDS.includes(op.k) &&
		typeof op.e === "string" && ID_RE.test(op.e)
	);
};

/** Applies one operation in place. Safe to repeat and to apply in any order. */
export function applyOp(state: SyncState, op: Op): void {
	const table = state[op.k];
	const cell = table[op.e];
	if (!cell || wins(op, cell)) table[op.e] = { t: op.t, i: op.i, v: op.v ?? null, c: Math.min(cell?.c ?? op.t, op.t) };
	else if (op.t < cell.c) cell.c = op.t;
}

/** Applies untrusted operations, skipping malformed ones. */
export function applyOps(state: SyncState, ops: unknown): void {
	if (!Array.isArray(ops)) return;
	for (const op of ops) if (isOp(op)) applyOp(state, op);
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
			applyOp(state, op);
			if (Number.isSafeInteger(cell.c) && cell.c > 0 && cell.c < state[k][e].c) state[k][e].c = cell.c;
		}
	}
}

export const cloneState = (s: SyncState): SyncState => JSON.parse(JSON.stringify(s));

/** Highest clock seen, so new operations always sort after everything this device knows. */
export const maxClock = (s: SyncState) => Math.max(0, ...KINDS.flatMap((k) => Object.values(s[k]).map((c) => c.t)));

// ── Untrusted values → app types ──────────────────────────────

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const money = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 && v < 1e10 ? Math.round(v * 100) / 100 : 0);

function toPerson(id: string, v: unknown): Person | null {
	const p = v as Partial<Person>;
	const name = str(p?.name, 60).trim();
	if (!name) return null;
	const person: Person = { id, name };
	const upiId = str(p.upiId, 80).trim();
	if (upiId) person.upiId = upiId;
	if (p.joined === true) person.joined = true;
	return person;
}

function toExpense(id: string, v: unknown, members: Set<string>): Expense | null {
	const x = v as Partial<Expense>;
	const amount = money(x?.amount);
	const paidBy = str(x?.paidBy, 64);
	const participants = Array.isArray(x?.participants) ? [...new Set(x.participants.map((p) => str(p, 64)))].filter((p) => members.has(p)) : [];
	// A member deleted on another device takes their entries with them.
	if (!amount || !members.has(paidBy) || participants.length === 0) return null;
	const splitMethod = x.splitMethod === "percentage" || x.splitMethod === "exact" ? x.splitMethod : "equally";
	const expense: Expense = { id, amount, paidBy, participants, splitMethod };
	const description = str(x.description, 200);
	if (description) expense.description = description;
	if (x.kind === "payment") expense.kind = "payment";
	if (Number.isSafeInteger(x.createdAt) && (x.createdAt as number) > 0) expense.createdAt = x.createdAt;
	if (!expense.kind && isMonthKey(x.repeat?.next)) expense.repeat = { next: x.repeat.next };
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
	return expense;
}

export const MAX_COMMENT = 500;

function toComment(id: string, v: unknown, expenses: Set<string>, members: Set<string>): ExpenseComment | null {
	const x = v as Partial<ExpenseComment>;
	const expenseId = str(x?.expenseId, 64);
	const text = str(x?.text, MAX_COMMENT).trim();
	if (!expenses.has(expenseId) || !text || !Number.isSafeInteger(x.at) || (x.at as number) <= 0) return null;
	const by = str(x.by, 64);
	return { id, expenseId, text, at: x.at as number, ...(members.has(by) ? { by } : {}) };
}

const toCurrency = (v: unknown): Currency => CURRENCIES.find((c) => c.code === (v as Currency | null)?.code) ?? DEFAULT_CURRENCY;

const live = (table: Record<string, Cell>) =>
	Object.entries(table)
		.filter(([, c]) => c.v !== null)
		.sort(([a, x], [b, y]) => x.c - y.c || (a < b ? -1 : 1));

/** The group this state describes. Device-only fields (local id, "who am I", sync link, nicknames) come from `local`. */
export function materialize(state: SyncState, local: Pick<Group, "id" | "meId" | "sync" | "nicknames">): Group {
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
		name: str(state.g.name?.v, 60).trim() || "Shared group",
		members,
		expenses,
		...(comments.length ? { comments } : {}),
		currency: toCurrency(state.g.currency?.v),
		...(isThemeId(state.g.theme?.v) ? { theme: state.g.theme.v as string } : {}),
		...(Number.isSafeInteger(state.g.closed?.v) && (state.g.closed.v as number) > 0 ? { closedAt: state.g.closed.v as number } : {}),
		...(local.meId !== undefined ? { meId: local.meId } : {}),
		...(local.sync ? { sync: local.sync } : {}),
		...(local.nicknames ? { nicknames: local.nicknames } : {}),
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
		const old = prev.get(id);
		if (!old || !same({ ...old, id: undefined }, { ...x, id: undefined })) out.push({ k, e: id, v });
		prev.delete(id);
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
	diffTable("m", before.members, after.members, out);
	diffTable("e", before.expenses, after.expenses, out);
	diffTable("c", before.comments ?? [], after.comments ?? [], out);
	return out;
}

/** Every entity of a group as changes, for the first upload. */
export const groupAsChanges = (g: Group): Change[] => diffGroup({ ...g, name: "", currency: { code: "", symbol: "", name: "" }, theme: undefined, closedAt: undefined, members: [], expenses: [], comments: [] }, g);

/** The parts of a group that are shared with everyone (device-only fields stripped). */
export const sharedView = (g: Group) => canon([g.name, g.currency.code, g.theme ?? null, g.closedAt ?? null, g.members, g.expenses, g.comments ?? []]);
