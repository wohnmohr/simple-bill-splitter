/**
 * Quick add: a sentence typed in English becomes expenses and, if needed, a group.
 *
 *   "Dinner 2400 split between me, Asha and Ben"
 *   "Goa trip: Asha 5000 hotel, Ben 1200 fuel, everyone equal"
 *   "rent 30k split 3 ways monthly"
 *
 * Rules, not a model, and it runs on the phone: names and amounts never leave
 * the device, the same promise the encrypted groups make. The parser never
 * guesses silently. Anything it filled in or wasn't sure of is listed in
 * `unsure`, and nothing is saved until the person has seen and confirmed a preview.
 *
 * parseQuickAdd reads the text; resolveQuickAdd matches the names to a
 * group's members and fills in what the text left implied. Pure functions with
 * only type imports, so they run in the browser and in node tests.
 */
import type { Person, SplitMethod } from "@/types";

/** The person typing. */
export const ME = "me";
/** Stands for whoever paid ("split between Rahul and her"), replaced once the payer is known. */
const PAYER = "@payer";

export type QuickField = "amount" | "payer" | "participants" | "split" | "repeat";

export type QuickSplit =
	| { method: "equally" }
	| { method: "percentage" | "exact"; weights: Record<string, number> };

/** One expense as typed. Names are as written, `ME` for the person typing. */
export type QuickExpense = {
	description: string;
	/** The total; 0 when the text had none. */
	amount: number;
	payer: string;
	participants: string[] | "everyone" | { ways: number };
	/** Only the shares the text stated; the rest are filled in by resolveQuickAdd. */
	split: QuickSplit;
	monthly: boolean;
	/** When it happened, as local noon, if the text said ("yesterday", "on the 5th"). */
	date?: number;
	/** Fields filled in by default or read with doubt: show them highlighted. */
	unsure: QuickField[];
};

export type QuickDraft = { groupName?: string; expenses: QuickExpense[] };

// ---------------------------------------------------------------------------
// Words

const words = (s: string) => new Set(s.split(/\s+/));

const ME_WORDS = words("i me myself mine");
const ALL_WORDS = words("everyone everybody all us group gang");
const PRONOUNS = words("him her them");
const PAY_VERBS = words("paid pays pay spent spends covered covers bought buys booked books gave put transferred sent got ordered");
const OWE_VERBS = words("owes owe");
const LEND_VERBS = words("lent lend lends loaned");
const BORROW_VERBS = words("borrowed borrow");
/** "Rahul and I had lunch": the people who had it, not who paid. */
const HAD_VERBS = words("had ate went");
const STRONG_LIST = words("between among amongst with");
const MONEY_WORDS = words("₹ $ € £ rs inr rupees rupee bucks");
const MULTIPLIERS: Record<string, number> = {
	k: 1e3, thousand: 1e3, l: 1e5, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, cr: 1e7, crore: 1e7, crores: 1e7,
};
const PEOPLE_WORDS = words("ways way people persons person ppl pax friends members guys of");
const EACH_WORDS = words("each pp apiece");
const EQUAL_WORDS = words("equally equal evenly even");
const UNEQUAL_WORDS = words("unequally unevenly");
const MONTHLY_WORDS = words("monthly recurring");
const OTHER_REPEAT_WORDS = words("weekly yearly annually daily");
/** Joins a name to its share: "Kiran pays 50%", "my share 400". */
const SHARE_LINKS = words("pays pay owes share 's is gets : -");

// Amounts in words: "fifteen hundred", "two lakh fifty thousand"
const UNITS = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS = "twenty thirty forty fifty sixty seventy eighty ninety".split(" ");
const SCALES: Record<string, number> = { hundred: 100, thousand: 1e3, lakh: 1e5, lakhs: 1e5, lac: 1e5, crore: 1e7 };
const NUMBER_WORD = `(?:${[...UNITS, ...TENS, ...Object.keys(SCALES)].join("|")})`;
const NUMBER_RUN = new RegExp(`\\b${NUMBER_WORD}(?:[\\s-]+(?:and[\\s-]+)?${NUMBER_WORD})*\\b`, "gi");

function wordsToNumber(run: string) {
	let total = 0;
	let current = 0;
	for (const w of run.toLowerCase().split(/[\s-]+/)) {
		if (UNITS.includes(w)) current += UNITS.indexOf(w);
		else if (TENS.includes(w)) current += (TENS.indexOf(w) + 2) * 10;
		else if (w === "hundred") current = (current || 1) * 100;
		else if (SCALES[w]) (total += (current || 1) * SCALES[w]), (current = 0);
	}
	return total + current;
}

/**
 * Writes amounts in words as digits. A lone small number stays a word ("two
 * pizzas") unless it counts people ("three ways"), and a lone "lakh" is left
 * for the number before it ("3 lakh").
 */
const numbersInWords = (text: string) =>
	text.replace(NUMBER_RUN, (run, at: number) => {
		const parts = run.toLowerCase().split(/[\s-]+/);
		if (parts.every((w) => SCALES[w])) return run;
		const counting = /^\s+(?:ways?|people|persons|of us|friends)\b/i.test(text.slice(at + run.length));
		if (parts.length === 1 && UNITS.includes(parts[0]) && !counting) return run;
		return String(wordsToNumber(run));
	});

/** Small words that are never names and are trimmed from the ends of a description. */
const FILLER = words(
	"a an the for on of at to towards in into and & with by from between among amongst split splitting divide divided " +
		"shared share sharing it its this that is was are were our your my his total worth just only about around approx some " +
		"per head person month every each then also plus : - paid pay pays spent got had bought booked covered put " +
		"gave ordered went ate ok please add new expense expenses",
);

/**
 * Common things people split. A capitalised word is read as a name
 * ("Asha 450 auto"), so these are the words that are capitalised at the start
 * of a sentence but are never someone's name.
 */
const THINGS = words(
	"dinner lunch breakfast brunch snacks snack tea coffee chai drinks drink beer beers wine party cake pizza pizzas burger " +
		"food meal meals groceries grocery vegetables veggies fruits milk icecream ice dessert sweets buffet biryani dosa " +
		"cab cabs uber ola rapido auto taxi bus train metro flight flights ticket tickets fuel petrol diesel gas toll tolls " +
		"parking car bike rental rent deposit maid cook electricity water wifi internet broadband phone recharge bill bills " +
		"netflix spotify prime hotstar subscription gym hotel stay homestay airbnb hostel resort room booking trip tour " +
		"movie movies concert show entry tickets bowling games game shopping clothes gift gifts present wedding birthday " +
		"laptop furniture repairs repair service medicine medicines doctor swiggy zomato blinkit zepto bigbasket amazon " +
		"flipkart cylinder laundry cleaning house flat office travel transport stuff things misc",
);

/** Words that are never read as a name, even lowercase in a list ("split with rahul equally"). */
const NOT_NAMES = new Set(
	[FILLER, THINGS, ALL_WORDS, MONTHLY_WORDS, EQUAL_WORDS, UNEQUAL_WORDS, MONEY_WORDS, PAY_VERBS, OWE_VERBS, LEND_VERBS, HAD_VERBS].flatMap((set) => [...set]),
);

/**
 * Common first names in India, plus common English ones. A name written right
 * before an amount, or after "for", must be one of these (or a member, or named
 * elsewhere in the text): "Riya 4000 villa" means Riya paid, "Biryani 900" means
 * biryani cost 900. Where only a name can go ("split with Zuvoka"), any name works.
 */
const FIRST_NAMES = words(
	// Indian
	"aadhya aadi aakash aarav aarohi aarti aaryan aditi aditya advait advik afreen afsana agastya ahaan ahana aisha " +
		"ajay ajit akash akhil akshay akshara alia alok amaan aman amar amarnath amey amir amit amitabh amol amrita amruta " +
		"anand ananya anant anaya anika anil anirudh anisha anita anjali anju ankit ankita ankur anmol annapurna anoop " +
		"anshul anu anuj anup anupam anurag anushka anvi apoorva aravind archana arijit arjun arnav arpita arun aruna " +
		"arundhati arvind aryan asha ashish ashok ashwin ashwini asif atul avani avantika avinash ayaan ayan ayesha " +
		"ayush azhar babita balaji bhagat bharat bhavana bhavesh bhavya bhumi bhushan bindu brijesh chaitanya chandan " +
		"chandra chetan chinmay chirag chitra daksh deepa deepak deepika deepti dev devansh devika dhanush dharini " +
		"dharmesh dhruv dhruvi diksha dilip dinesh disha divya divyanshi farah farhan fatima ganesh gaurav gautam gayatri " +
		"geeta girish gopal govind gunjan gurpreet harini harish harleen harpreet harsh harsha harshit hema hemant " +
		"himanshu hrithik indira indu inaya irfan isha ishaan ishani ishita jagdish jai jasleen jaspreet jatin jay " +
		"jayant jaya jayesh jeevan jignesh jyoti kabir kajal kalpana kamal kamala kanika kapil karan kareena karthik " +
		"kartik kashish kavita kavya keerthi ketan khushi kiara kiran kishore komal krish krishna kriti kshitij kunal " +
		"kushal lakshay lakshmi lalit lata leela lokesh madhav madhavi madhu madhuri mahesh mahi manav manish manisha " +
		"manju manoj mansi meena meenakshi meera megha mehul mihir mira mitali mohan mohit mohini mukesh muskan nadia " +
		"nagesh naina naman namita nandini naresh naveen navya neel neelam neeraj neha nidhi nikhil nikita nilesh nina " +
		"nirmala nisha nishant nitin nivedita omkar padma pallavi pankaj parag paras parth parul pavan pawan payal " +
		"pooja poonam prabhu pradeep prajakta prakash pranav prasad prashant pratik pratima praveen preeti prem prerna " +
		"priya priyanka puja pushpa rachana radha radhika raghav rahul raj rajat rajesh rajiv rajni rakesh rakhi ram " +
		"raman ramesh rani ranjit rashmi ravi reena rekha renu reva reyansh rhea richa riddhi rishabh rishi ritesh " +
		"ritika ritu riya rohan rohini rohit roshan ruchi rudra rupali rutuja saanvi sachin sagar sahil sai saira " +
		"sakshi salman sameer samir sana sandeep sandhya sangeeta sanjana sanjay sanjeev sankalp santosh sanya sapna " +
		"sara sarika saroj satish saurabh savita seema shabnam shaan shalini shankar sharad shashank shefali shikha " +
		"shilpa shiv shivam shivani shobha shraddha shravan shreya shreyas shruti shubham shweta siddharth siddhi " +
		"simran sneha sonal sonali sonam sonia sourav sridhar srinivas sruthi subhash suchitra sudha sudhir sujata " +
		"sukhwinder sumit sumitra sunaina sunil sunita suraj surbhi suresh surya sushant sushma swapnil swati tanisha " +
		"tanmay tanvi tanya tara tarun tejas trisha tushar uday ujjwal uma umesh urmila urvashi utkarsh vaibhav " +
		"vaishnavi vandana vani varsha varun vasudha vedant venkat vidya vihaan vijay vikas vikram vimal vinay vineet " +
		"vinita vinod vipin vishal vishnu vivaan vivek yamini yash yashika yogesh yuvraj zain zara zeenat zoya " +
		// English and elsewhere
		"aaron abby adam adrian alan albert alex alexander alice alicia amanda amelia amy andrea andrew angela anna " +
		"anne anthony arthur ashley ben benjamin beth brandon brian bruce carl carlos carol caroline catherine charles " +
		"charlie chloe chris christina christopher claire daniel david deborah dennis diana donald dorothy dylan " +
		"edward elizabeth ella ellie emily emma eric ethan eva frank gary george grace greg hannah harry helen henry " +
		"ian isaac isabella jack jacob james jane jason jeff jennifer jerry jessica joe john jonathan joseph joshua " +
		"julia julie justin karen kate katherine kevin kyle laura lauren leo liam linda lisa logan lucas lucy luke " +
		"maria mark martin mary matt matthew megan melissa michael michelle mike nancy nathan nicholas nick nicole " +
		"noah olivia oscar patrick paul peter rachel rebecca richard robert ryan sam samantha samuel sandra sarah " +
		"scott sean sophia sophie stephen steve steven susan thomas tim timothy tom tony tyler victoria william zoe",
);

// ---------------------------------------------------------------------------
// Tokens

type Tok = {
	text: string;
	low: string;
	used: boolean;
	/** For number tokens: what the number turned out to be. */
	role?: "money" | "pct" | "ways" | "ratio" | "date";
	value?: number;
	/** On the first number of a ratio like 60/40: all its parts. */
	ratio?: number[];
};

const TOKEN = /₹|\$|€|£|%|\d[\d,]*(?:\.\d+)?|[a-z]+(?:['’][a-z]+)?|[/:&-]/gi;

const isNumber = (t?: Tok) => !!t && /^\d/.test(t.text);
const parseNumber = (s: string) => Number(s.replace(/,/g, ""));

const tokenize = (text: string): Tok[] =>
	(text.match(TOKEN) ?? []).map((text) => ({ text, low: text.toLowerCase().replace("’", "'"), used: false }));

/** Before splitting: spellings that would otherwise be cut in the wrong place. */
const normalize = (text: string) =>
	text
		.replace(/\brs\.\s*/gi, "rs ")
		.replace(/\/-/g, " ")
		.replace(/\bb\/w\b/gi, "between")
		.replace(/\bper\s+cent\b/gi, "percent");

// Dates: "yesterday", "last friday", "on the 5th", "5 oct", "oct 5th"
const MONTHS = "jan feb mar apr may jun jul aug sep oct nov dec".split(" ");
const WEEKDAYS = "sunday monday tuesday wednesday thursday friday saturday".split(" ");
const ORDINALS = words("st nd rd th");
const monthOf = (t?: Tok) => (t && /^[a-z]{3,9}$/.test(t.low) ? MONTHS.indexOf(t.low.slice(0, 3)) : -1);
const isMonth = (t?: Tok) => monthOf(t) >= 0 && (t!.low.length <= 4 || t!.low.startsWith(MONTHS[monthOf(t)]));
const isDay = (t?: Tok) => !!t && /^\d{1,2}$/.test(t.text) && +t.text >= 1 && +t.text <= 31;

/** Local noon of a day, so time zones never move the date. */
const noon = (y: number, m: number, d: number) => new Date(y, m, d, 12).getTime();

/** Finds a date in the piece and uses up its words. Dates are always in the past. */
function readDate(toks: Tok[], now: number): number | undefined {
	const today = new Date(now);
	const [y, m, d] = [today.getFullYear(), today.getMonth(), today.getDate()];
	const daysAgo = (n: number) => noon(y, m, d - n);
	for (let i = 0; i < toks.length; i++) {
		const t = toks[i];
		const next = toks[i + 1];
		const done = (...used: (Tok | undefined)[]) => used.forEach((u) => u && (u.used = true));
		if (t.low === "today" || t.low === "tonight") return done(t), daysAgo(0);
		// "yesterday's dinner" keeps the word in the description.
		if (t.low === "yesterday's") return daysAgo(1);
		if (t.low === "yesterday") return toks[i - 1]?.low === "before" ? (done(t, toks[i - 1], toks[i - 2]), daysAgo(2)) : (done(t), daysAgo(1));
		if (t.low === "last" && next?.low === "night") return done(t, next), daysAgo(1);
		const weekday = next ? WEEKDAYS.indexOf(next.low) : -1;
		if ((t.low === "last" || t.low === "on") && weekday >= 0) return done(t, next), daysAgo(((today.getDay() - weekday + 6) % 7) + 1);
		if (!isDay(t)) continue;
		// A day of the month needs "th" or a month next to it, so "5 people" stays a count.
		const ordinal = ORDINALS.has(next?.low ?? "") ? next : undefined;
		const after = toks[i + (ordinal ? 2 : 1)];
		const month = isMonth(after) ? monthOf(after) : isMonth(toks[i - 1]) ? monthOf(toks[i - 1]) : -1;
		if (!ordinal && month < 0) continue;
		done(t, ordinal, month >= 0 ? (isMonth(after) ? after : toks[i - 1]) : undefined);
		if (["on", "the"].includes(toks[i - 1]?.low ?? "")) done(toks[i - 1], toks[i - 2]?.low === "on" ? toks[i - 2] : undefined);
		t.role = "date";
		const date = noon(y, month >= 0 ? month : m, +t.text);
		// Not yet this month (or this year): it was last month (or last year).
		return date <= now ? date : month >= 0 ? noon(y - 1, month, +t.text) : noon(y, m - 1, +t.text);
	}
	return undefined;
}

/** Marks every number as money, a percentage, a head count or a ratio, and uses up the words around it. */
function classifyNumbers(toks: Tok[]) {
	for (let i = 0; i < toks.length; i++) {
		const t = toks[i];
		if (!isNumber(t) || t.role) continue;
		const next = toks[i + 1];
		const prev = toks[i - 1];

		// 60/40, 50-30-20, 2:1
		if (next && "/:-".includes(next.text) && isNumber(toks[i + 2])) {
			const parts = [t];
			let j = i + 1;
			while ("/:-".includes(toks[j]?.text ?? "x") && isNumber(toks[j + 1])) {
				toks[j].used = true;
				parts.push(toks[j + 1]);
				j += 2;
			}
			if (parts.every((p) => parseNumber(p.text) <= 100)) {
				t.ratio = parts.map((p) => parseNumber(p.text));
				parts.forEach((p) => Object.assign(p, { role: "ratio", used: true }));
				continue;
			}
			// Not a ratio after all: put the separators back.
			for (let k = i + 1; k < j; k += 2) toks[k].used = false;
		}

		t.used = true;
		const value = parseNumber(t.text);
		if (next && (next.low === "%" || next.low === "percent" || next.low === "pct")) {
			Object.assign(t, { role: "pct", value });
			next.used = true;
		} else if (next && PEOPLE_WORDS.has(next.low) && (next.low !== "of" || toks[i + 2]?.low === "us")) {
			Object.assign(t, { role: "ways", value });
			next.used = true;
			if (next.low === "of") toks[i + 2].used = true;
		} else if (prev && (prev.low === "between" || prev.low === "among") && !next) {
			Object.assign(t, { role: "ways", value });
		} else {
			let amount = value;
			let j = i + 1;
			const mult = toks[j] && MULTIPLIERS[toks[j].low];
			if (mult) {
				amount *= mult;
				toks[j++].used = true;
			}
			if (toks[j] && MONEY_WORDS.has(toks[j].low)) toks[j].used = true;
			if (prev && MONEY_WORDS.has(prev.low)) prev.used = true;
			Object.assign(t, { role: "money", value: Math.round(amount * 100) / 100 });
		}
	}
}

// ---------------------------------------------------------------------------
// One piece of a sentence ("Dinner 2400 split between me", "Asha", "Ben paid")

type ListKind = "exact" | "with" | "for" | "implicit";

type Bit = {
	amount?: number;
	perHead?: boolean;
	/** A name written right before the amount: "Asha 5000 hotel". Payer or share, decided by context. */
	lead?: string;
	payer?: string;
	lists: { kind: ListKind; names: string[] }[];
	/** The piece ends in a list that the next piece may carry on ("between me", "Asha", "Ben"). */
	openList?: ListKind;
	/** A piece that is only names. */
	namesOnly?: string[];
	everyone?: boolean;
	ways?: number;
	ratio?: number[];
	shares: { name: string; value: number; pct: boolean }[];
	equal?: boolean;
	unequal?: boolean;
	monthly?: boolean;
	otherRepeat?: boolean;
	date?: number;
	description: string;
};

type Names = {
	/** Canonical spelling of every name known so far: the group's members, then names met in this text. */
	known: Map<string, string>;
};

const isCapitalised = (t: Tok) => /^[A-Z][a-z]/.test(t.text);
const isWord = (t?: Tok) => !!t && /^[a-z]/i.test(t.text);

/**
 * How sure a place in the sentence is that a word there is a name: "loose"
 * where only a name can go ("split with rahul"), "strict" where a capitalised
 * word or a common first name is enough ("Cab 450 Asha"), and "lead", before an
 * amount or after "for", where it must be a known or common first name.
 */
type Slot = "loose" | "strict" | "lead";

/** The name a token stands for in that slot. A new name is remembered, so later mentions get the same spelling. */
function nameOf(t: Tok | undefined, names: Names, slot: Slot): string | undefined {
	if (!t || !isWord(t) || t.low.endsWith("'s")) return undefined;
	if (ME_WORDS.has(t.low)) return ME;
	if (PRONOUNS.has(t.low)) return PAYER;
	const known = names.known.get(t.low);
	if (known) return known;
	if (NOT_NAMES.has(t.low) || t.low.length < 2) return undefined;
	if (!(FIRST_NAMES.has(t.low) || slot === "loose" || (slot === "strict" && isCapitalised(t)))) return undefined;
	names.known.set(t.low, t.text);
	return t.text;
}

const isVerb = (t?: Tok) =>
	!!t && (PAY_VERBS.has(t.low) || OWE_VERBS.has(t.low) || LEND_VERBS.has(t.low) || BORROW_VERBS.has(t.low) || HAD_VERBS.has(t.low));

function readPiece(text: string, names: Names, listOpen: boolean, now: number): Bit {
	const toks = tokenize(text);
	const bit: Bit = { lists: [], shares: [], description: "" };
	bit.date = readDate(toks, now);
	classifyNumbers(toks);
	const use = (t: Tok) => (t.used = true);

	/** Whether token i comes straight after an amount ("2.5 thousand rupees each"). */
	const afterMoney = (i: number) => {
		let j = i - 1;
		while (j >= 0 && (MULTIPLIERS[toks[j].low] || MONEY_WORDS.has(toks[j].low))) j--;
		return toks[j]?.role === "money";
	};

	// Repeats, equal or not, "each"
	toks.forEach((t, i) => {
		const next = toks[i + 1];
		if (MONTHLY_WORDS.has(t.low)) (bit.monthly = true), use(t);
		else if (t.low === "month" && ["every", "each", "per", "a", "/"].includes(toks[i - 1]?.low ?? "")) {
			bit.monthly = true;
			use(t), use(toks[i - 1]);
		} else if (OTHER_REPEAT_WORDS.has(t.low)) (bit.otherRepeat = true), use(t);
		else if (EQUAL_WORDS.has(t.low)) (bit.equal = true), use(t);
		else if (UNEQUAL_WORDS.has(t.low)) (bit.unequal = true), use(t);
		else if (EACH_WORDS.has(t.low) && afterMoney(i)) (bit.perHead = true), use(t);
		else if ((t.low === "per" || t.low === "a") && next && ["head", "person", "pax"].includes(next.low) && afterMoney(i)) {
			bit.perHead = true;
			use(t), use(next);
		}
	});

	const firstMoney = toks.find((t) => t.role === "money");
	bit.ratio = toks.find((t) => t.ratio)?.ratio;
	const ways = toks.find((t) => t.role === "ways");
	if (ways) bit.ways = ways.value;

	// "X paid", "paid by X", "X owes me", "I lent X", "Rahul and I had"
	// ("Kiran pays 50%" is a share, read below.)
	const v = toks.findIndex((t, i) => isVerb(t) && toks[i + 1]?.role !== "pct");
	if (v >= 0) {
		const verb = toks[v];
		use(verb);
		// The subject: names written just before the verb.
		const subject: string[] = [];
		for (let j = v - 1; j >= 0; j--) {
			if (toks[j].low === "and" || toks[j].low === "&") continue;
			const n = nameOf(toks[j], names, "loose");
			if (!n) break;
			subject.unshift(n);
			use(toks[j]);
		}
		const object = () => {
			const t = toks[v + 1];
			const n = nameOf(t, names, "loose");
			if (n) use(t);
			return n;
		};
		if (OWE_VERBS.has(verb.low)) {
			bit.payer = object();
			bit.lists.push({ kind: "exact", names: subject.length ? subject : [ME] });
		} else if (LEND_VERBS.has(verb.low)) {
			bit.payer = subject[0] ?? ME;
			const o = object();
			if (o) bit.lists.push({ kind: "exact", names: [o] });
		} else if (BORROW_VERBS.has(verb.low)) {
			const from = toks.findIndex((t, j) => j > v && t.low === "from");
			const lender = from >= 0 ? nameOf(toks[from + 1], names, "loose") : undefined;
			if (lender) use(toks[from]), use(toks[from + 1]), (bit.payer = lender);
			bit.lists.push({ kind: "exact", names: subject.length ? subject : [ME] });
		} else if (HAD_VERBS.has(verb.low)) {
			if (subject.length) bit.lists.push({ kind: "implicit", names: subject });
		} else if (toks[v + 1]?.low !== "by") {
			// "Asha paid", or "paid 450 for parking": the person typing paid.
			bit.payer = subject[0] ?? ME;
		}
	}

	// "by X": "paid by Asha"
	toks.forEach((t, i) => {
		if (t.low !== "by" || bit.payer) return;
		const n = nameOf(toks[i + 1], names, "loose");
		if (n) (bit.payer = n), use(t), use(toks[i + 1]);
	});

	// Lists: "between me, Asha", "with Rahul", "for me and Ben", "among all of us"
	const hasStrongList = toks.some((t) => STRONG_LIST.has(t.low));
	toks.forEach((t, i) => {
		if (t.used) return;
		const kind: ListKind | undefined = STRONG_LIST.has(t.low) ? (t.low === "with" ? "with" : "exact") : t.low === "for" && !hasStrongList ? "for" : undefined;
		if (!kind) return;
		const listed: string[] = [];
		let j = i + 1;
		let everyone = false;
		for (; j < toks.length; j++) {
			const u = toks[j];
			if (u.used && u.role !== "ways") break;
			if (u.role === "ways") continue;
			if (u.low === "and" || u.low === "&" || u.low === "the" || (u.low === "of" && everyone)) continue;
			if (ALL_WORDS.has(u.low)) {
				everyone = true;
				use(u);
				continue;
			}
			// After "for", only someone clearly a person: "for Ben", not "for Biryani".
			const n = nameOf(u, names, kind === "for" ? "lead" : "loose");
			if (!n) break;
			listed.push(n);
			use(u);
		}
		if (!listed.length && !everyone) return;
		use(t);
		if (everyone) bit.everyone = true;
		if (listed.length) bit.lists.push({ kind, names: listed });
		if (toks.slice(j).every((u) => u.used)) bit.openList = kind;
	});

	// Shares stated after the amount: "Asha 1500 Ben 900", "my share 400", "Ben 70%", "60% Asha"
	toks.forEach((t, i) => {
		if (!(t.role === "pct" || (t.role === "money" && t !== firstMoney))) return;
		let j = i - 1;
		while (j >= 0 && SHARE_LINKS.has(toks[j].low)) j--;
		let name = toks[j]?.low === "my" ? ME : nameOf(toks[j], names, "strict");
		if (name && !toks[j].used) {
			for (let k = j; k < i; k++) use(toks[k]);
		} else if (t.role === "pct" && (name = nameOf(toks[i + 1], names, "strict"))) {
			use(toks[i + 1]);
		} else return;
		bit.shares.push({ name, value: t.value!, pct: t.role === "pct" });
	});

	// A name right before the amount: "Asha 5000 hotel", "Arjun: 780 petrol", "me 30%"
	const firstNumber = toks.findIndex((t) => t.role === "money" || t.role === "pct");
	const before = toks.slice(0, firstNumber).filter((t) => !t.used && !FILLER.has(t.low));
	if (firstMoney && before.length === 1 && !bit.payer) {
		const n = nameOf(before[0], names, "lead");
		if (n) (bit.lead = n), use(before[0]);
	}

	// Names after the amount, with nothing joining them: "Cab 450 me and Rahul"
	if (firstMoney) {
		const after = toks.slice(toks.indexOf(firstMoney) + 1);
		after.filter((t) => !t.used && ALL_WORDS.has(t.low)).forEach((t) => (use(t), (bit.everyone = true)));
		const implicit = after.filter((t) => !t.used && t.low !== "and" && nameOf(t, names, "lead"));
		if (implicit.length) {
			implicit.forEach(use);
			bit.lists.push({ kind: "implicit", names: implicit.map((t) => nameOf(t, names, "lead")!) });
			if (after.every((t) => t.used || t.low === "and")) bit.openList = "implicit";
		}
	}

	// A piece that is only names: the rest of a list, or who it was for ("everyone").
	if (!toks.some((t) => t.role)) {
		const rest = toks.filter((t) => !t.used && t.low !== "and" && t.low !== "&");
		const isAll = (t: Tok) => ALL_WORDS.has(t.low) || t.low === "of";
		const named = rest.filter((t) => !isAll(t)).map((t) => nameOf(t, names, listOpen ? "loose" : "strict"));
		if (rest.length && named.every(Boolean)) {
			rest.forEach(use);
			if (named.length) bit.namesOnly = named as string[];
			else bit.everyone = true;
		}
	}

	if (firstMoney) bit.amount = firstMoney.value;
	bit.description = describe(toks);
	return bit;
}

/** The words nobody else claimed, without the small words at either end. */
function describe(toks: Tok[]) {
	const keep = toks.filter((t) => !t.used && (isWord(t) || t.text === "&"));
	let start = 0;
	let end = keep.length;
	while (start < end && FILLER.has(keep[start].low)) start++;
	while (end > start && FILLER.has(keep[end - 1].low)) end--;
	return keep.slice(start, end).map((t) => t.text).join(" ");
}

const hasMeaning = (b: Bit) =>
	b.amount !== undefined || b.payer || b.lead || b.lists.length || b.namesOnly || b.everyone || b.ways || b.ratio ||
	b.shares.length || b.equal || b.unequal || b.monthly || b.otherRepeat || b.date;

// ---------------------------------------------------------------------------
// Sentence → expenses

type Building = {
	bits: Bit[];
	amount?: number;
	perHead?: boolean;
	payer?: string;
	lists: { kind: ListKind; names: string[] }[];
	everyone?: boolean;
	ways?: number;
	ratio?: number[];
	shares: Bit["shares"];
	equal?: boolean;
	unequal?: boolean;
	monthly?: boolean;
	otherRepeat?: boolean;
	date?: number;
	description: string;
};

const SEPARATOR = /(\s*(?:,(?!\d)|;|\n|\.(?=\s|$)|\s(?:and|&|then|also|plus)\s)\s*)/i;

/** Splits a sentence at commas, "and", full stops and new lines, joining back bits that are only words. */
function pieces(text: string, names: Names, now: number): string[] {
	const parts = text.split(SEPARATOR);
	const out: { text: string; sep: string }[] = [];
	for (let i = 0; i < parts.length; i += 2) {
		if (parts[i].trim()) out.push({ text: parts[i].trim(), sep: parts[i - 1] ?? " " });
	}
	// "drinks and snacks 800": "drinks" alone means nothing, so it belongs with a neighbour.
	for (let i = 0; i < out.length; i++) {
		const probe = { known: new Map(names.known) };
		if (hasMeaning(readPiece(out[i].text, probe, false, now)) || out.length === 1) continue;
		const next = out[i + 1];
		const nextFirst = next ? tokenize(next.text)[0] : undefined;
		// Forward when the next piece starts with more words ("snacks 800"), back when it starts with someone ("Ben paid").
		if (next && nextFirst && !isNumber(nextFirst) && !nameOf(nextFirst, { known: new Map(names.known) }, "strict")) {
			next.text = out[i].text + next.sep + next.text;
			next.sep = out[i].sep;
			out.splice(i--, 1);
		} else if (i > 0) {
			out[i - 1].text += out[i].sep + out[i].text;
			out.splice(i--, 1);
		}
	}
	return out.map((p) => p.text);
}

/** Copies what a piece says onto the expense it belongs to. */
function absorb(e: Building, b: Bit) {
	e.bits.push(b);
	if (b.amount !== undefined && e.amount === undefined) e.amount = b.amount;
	e.perHead ||= b.perHead;
	if (b.payer && !e.payer) e.payer = b.payer;
	e.lists.push(...b.lists);
	if (b.namesOnly) e.lists.push({ kind: "implicit", names: b.namesOnly });
	e.everyone ||= b.everyone;
	e.ways ??= b.ways;
	e.ratio ??= b.ratio;
	e.shares.push(...b.shares);
	e.equal ||= b.equal;
	e.unequal ||= b.unequal;
	e.monthly ||= b.monthly;
	e.otherRepeat ||= b.otherRepeat;
	e.date ??= b.date;
	if (b.description && !e.description) e.description = b.description;
}

const emptyBuilding = (): Building => ({ bits: [], lists: [], shares: [], description: "" });

const sharedTotal = (e: Building) => e.shares.filter((s) => !s.pct).reduce((s, x) => s + x.value, 0);

/** Reads typed text. `memberNames` are the group's members, so lowercase names are recognised too. */
export function parseQuickAdd(input: string, memberNames: string[] = [], now = Date.now()): QuickDraft {
	const names: Names = { known: new Map(memberNames.map((n) => [n.trim().toLowerCase(), n.trim()])) };
	let text = numbersInWords(normalize(input.trim()));

	// "Goa trip: ..." names the group, unless it's "Arjun: 780 petrol".
	let groupName: string | undefined;
	const colon = text.match(/^([^:\d\n]{1,40}):\s*([\s\S]+)$/);
	const prefix = colon ? tokenize(colon[1]) : [];
	if (colon && !(prefix.length === 1 && nameOf(prefix[0], { known: new Map(names.known) }, "lead"))) {
		groupName = colon[1].trim();
		text = colon[2];
	}

	const expenses: Building[] = [];
	let pending = emptyBuilding();
	let cur: Building | undefined;
	let trailing: Bit[] = [];
	let open: ListKind | undefined;

	for (const piece of pieces(text, names, now)) {
		const b = readPiece(piece, names, !!open, now);
		const target = cur ?? pending;

		if (b.namesOnly && open) {
			// The rest of a list: "split between me", "Asha", "Ben"
			const list = [...target.lists].reverse().find((l) => l.kind === open);
			if (list) list.names.push(...b.namesOnly);
			else target.lists.push({ kind: open, names: b.namesOnly });
			continue;
		}

		const isShare =
			b.amount !== undefined && b.lead && !b.description && !b.payer && cur?.amount !== undefined &&
			sharedTotal(cur) + b.amount <= cur.amount + 0.005;
		if (isShare && cur) {
			cur.shares.push({ name: b.lead!, value: b.amount!, pct: false }, ...b.shares);
			open = undefined;
		} else if (b.amount !== undefined) {
			cur = pending.bits.length ? pending : emptyBuilding();
			pending = emptyBuilding();
			if (b.lead && !b.payer) cur.payer = b.lead;
			absorb(cur, b);
			expenses.push(cur);
			trailing = [];
			open = b.openList;
		} else {
			absorb(target, b);
			if (cur) trailing.push(b);
			open = b.openList;
		}
	}
	if (!expenses.length && pending.bits.length) expenses.push(pending);

	// "Asha 5000 hotel, Ben 1200 fuel, everyone equal": what comes after the last expense is for all of them.
	if (expenses.length > 1) {
		for (const b of trailing) {
			for (const e of expenses.slice(0, -1)) {
				const listed = e.lists.length || e.everyone || e.ways;
				absorb(e, {
					...b,
					description: "",
					payer: e.payer ? undefined : b.payer,
					lists: listed ? [] : b.lists,
					everyone: listed ? undefined : b.everyone,
					ways: listed ? undefined : b.ways,
				});
			}
		}
	}

	const anyMonthly = expenses.some((e) => e.monthly);
	const drafts = expenses.map((e) => finish(e, anyMonthly));
	if (groupName) drafts.forEach((d) => (d.description ||= groupName!));
	return { groupName, expenses: drafts };
}

/** Turns what was gathered for one expense into a QuickExpense, noting what was assumed. */
function finish(e: Building, anyMonthly: boolean): QuickExpense {
	const unsure = new Set<QuickField>();
	const payer = e.payer ?? ME;
	if (!e.payer) unsure.add("payer");

	const listed: string[] = [];
	const add = (n: string) => {
		const name = n === PAYER ? payer : n;
		if (!listed.some((x) => x.toLowerCase() === name.toLowerCase())) listed.push(name);
	};
	for (const l of e.lists) {
		if (l.kind === "with") add(payer);
		l.names.forEach(add);
	}
	e.shares.forEach((s) => add(s.name));

	let participants: QuickExpense["participants"];
	if (listed.length && !(e.everyone && e.lists.every((l) => l.kind === "for"))) participants = listed;
	else if (e.everyone) participants = "everyone";
	else if (e.ways) participants = { ways: e.ways };
	else {
		participants = "everyone";
		unsure.add("participants");
	}

	let split: QuickSplit = { method: "equally" };
	const pcts = e.shares.filter((s) => s.pct);
	const amounts = e.shares.filter((s) => !s.pct);
	const byName = (list: Bit["shares"]) => Object.fromEntries(list.map((s) => [s.name === PAYER ? payer : s.name, s.value]));
	if (e.ratio && Array.isArray(participants) && participants.length === e.ratio.length) {
		const sum = e.ratio.reduce((s, x) => s + x, 0);
		split = { method: "percentage", weights: Object.fromEntries(participants.map((n, i) => [n, Math.round((e.ratio![i] / sum) * 10000) / 100])) };
	} else if (e.ratio || (pcts.length && amounts.length)) {
		unsure.add("split");
	} else if (pcts.length) {
		split = { method: "percentage", weights: byName(pcts) };
	} else if (amounts.length) {
		split = { method: "exact", weights: byName(amounts) };
	} else if (e.unequal) {
		unsure.add("split");
	}

	let amount = e.amount ?? 0;
	if (!e.amount) unsure.add("amount");
	if (e.perHead) {
		const heads = Array.isArray(participants) ? participants.length : typeof participants === "object" ? participants.ways : 0;
		if (heads) amount = Math.round(amount * heads * 100) / 100;
		else unsure.add("amount");
	}
	if (e.otherRepeat || (!e.monthly && anyMonthly)) unsure.add("repeat");

	const description = e.description.charAt(0).toUpperCase() + e.description.slice(1);
	return { description, amount, payer, participants, split, monthly: !!e.monthly, date: e.date, unsure: [...unsure] };
}

// ---------------------------------------------------------------------------
// Matching names to a group

/** Someone in the preview: a member already in the group, or someone to add. */
export type QuickPerson = { key: string; name: string; isNew: boolean; isMe: boolean; unsure: boolean };

export type QuickResolvedExpense = {
	description: string;
	amount: number;
	paidBy: string;
	participants: string[];
	splitMethod: SplitMethod;
	/** Percentages or exact amounts for every participant, by key; absent when equal. */
	weights?: Record<string, number>;
	monthly: boolean;
	date?: number;
	unsure: QuickField[];
};

export type QuickResolved = { groupName?: string; people: QuickPerson[]; expenses: QuickResolvedExpense[] };

/** Key of the person typing when the group doesn't know who that is yet. */
export const NEW_ME = "new:me";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Matches names to the group's members (whole name, or a unique first name),
 * adds anyone new, and fills in what the text implied: "everyone", "3 ways",
 * and the shares nobody stated. `members` is empty for a new group.
 */
export function resolveQuickAdd(draft: QuickDraft, members: Person[], meId?: string | null): QuickResolved {
	const people: QuickPerson[] = members.map((m) => ({ key: m.id, name: m.name, isNew: false, isMe: m.id === meId, unsure: false }));
	const keyOf = (name: string): string => {
		if (name === ME) {
			if (!people.some((p) => p.isMe)) people.push({ key: NEW_ME, name: "", isNew: true, isMe: true, unsure: true });
			return people.find((p) => p.isMe)!.key;
		}
		const low = name.toLowerCase();
		const match =
			people.find((p) => p.name.toLowerCase() === low) ??
			(() => {
				const firsts = people.filter((p) => p.name.toLowerCase().split(/\s+/)[0] === low);
				return firsts.length === 1 ? firsts[0] : undefined;
			})();
		if (match) return match.key;
		const key = `new:${low}`;
		people.push({ key, name, isNew: true, isMe: false, unsure: false });
		return key;
	};

	// Everyone named anywhere, so "everyone" in a new group means all of them.
	for (const e of draft.expenses) {
		keyOf(e.payer);
		if (Array.isArray(e.participants)) e.participants.forEach(keyOf);
		if (e.split.method !== "equally") Object.keys(e.split.weights).forEach(keyOf);
	}
	// In a new group, the person typing is almost always part of it.
	if (!members.length && draft.expenses.some((e) => !Array.isArray(e.participants))) keyOf(ME);

	const expenses = draft.expenses.map((e): QuickResolvedExpense => {
		const unsure = new Set(e.unsure);
		let participants: string[];
		if (Array.isArray(e.participants)) participants = e.participants.map(keyOf);
		else if (e.participants === "everyone") participants = people.map((p) => p.key);
		else {
			const { ways } = e.participants;
			participants = people.map((p) => p.key);
			if (participants.length !== ways) {
				// "3 ways" with names we don't have: the people we know, then placeholders to rename.
				unsure.add("participants");
				if (!members.length) {
					participants = [keyOf(ME)];
					for (let n = 2; n <= ways; n++) {
						const key = `new:person ${n}`;
						if (!people.some((p) => p.key === key)) people.push({ key, name: `Person ${n}`, isNew: true, isMe: false, unsure: true });
						participants.push(key);
					}
				}
			}
		}

		let weights: Record<string, number> | undefined;
		if (e.split.method !== "equally") {
			const total = e.split.method === "percentage" ? 100 : e.amount;
			const given = Object.fromEntries(Object.entries(e.split.weights).map(([n, v]) => [keyOf(n), v]));
			const rest = participants.filter((k) => !(k in given));
			const left = total - Object.values(given).reduce((s, v) => s + v, 0);
			weights = { ...given };
			// Whatever nobody stated is shared equally by the others.
			rest.forEach((k) => (weights![k] = round2(left / rest.length)));
			if (Math.abs(left) > 0.01 && !rest.length) unsure.add("split");
			if (left < -0.01) unsure.add("split");
		}

		return {
			description: e.description,
			amount: e.amount,
			paidBy: keyOf(e.payer),
			participants,
			splitMethod: e.split.method,
			weights,
			monthly: e.monthly,
			date: e.date,
			unsure: [...unsure],
		};
	});

	return { groupName: draft.groupName, people, expenses };
}
