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

/** `currency`: the one currency the text wrote ("$50", "₹2400", "500 rupees"), as a code; absent when none or several. */
export type QuickDraft = { groupName?: string; currency?: string; expenses: QuickExpense[] };

// ---------------------------------------------------------------------------
// Words

const words = (s: string) => new Set(s.split(/\s+/));

const ME_WORDS = words("i me myself mine");
const ALL_WORDS = words("everyone everybody all us group gang");
const PRONOUNS = words("him her them");
const PAY_VERBS = words("paid pays pay paying spent spends covered covers bought buys booked put got grabbed ordered settled");
const OWE_VERBS = words("owes owe owed");
const LEND_VERBS = words("lent lend lends loaned gave sent transferred");
/** "took" only counts with a lender: "took 5000 from Deepika". */
const BORROW_VERBS = words("borrowed borrow took");
/** "she owes me": someone named elsewhere, so the list comes from there. */
const SUBJECT_PRONOUNS = words("he she they");
/** "Rahul and I had lunch": the people who had it, not who paid. */
const HAD_VERBS = words("had ate went shared");
const STRONG_LIST = words("between among amongst with");
const DIVIDE_WORDS = words("split divide divided shared");
/** Currency symbols and words, and the currency each one means. */
const CURRENCY_WORDS: Record<string, string> = {
	"₹": "INR", rs: "INR", inr: "INR", rupee: "INR", rupees: "INR",
	$: "USD", usd: "USD", dollar: "USD", dollars: "USD",
	"€": "EUR", eur: "EUR", euro: "EUR", euros: "EUR",
	"£": "GBP", gbp: "GBP",
	"¥": "JPY", jpy: "JPY", yen: "JPY",
};
const MONEY_WORDS = new Set([...Object.keys(CURRENCY_WORDS), "bucks"]);
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
const SHARE_LINKS = words("pays pay paying covers cover owes owe takes take had share part portion 's is gets : -");

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
		const tens = UNITS.indexOf(w) >= 10 ? UNITS.indexOf(w) : TENS.includes(w) ? (TENS.indexOf(w) + 2) * 10 : 0;
		// "nineteen ninety nine" is said as hundreds: 19 then 99 makes 1999.
		if (tens && current % 100 >= 10) current = current * 100 + tens;
		else if (UNITS.includes(w)) current += UNITS.indexOf(w);
		else if (TENS.includes(w)) current += tens;
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
		const counting = /^\s+(?:ways?|people|persons|of us|friends|days? ago)\b/i.test(text.slice(at + run.length));
		if (parts.length === 1 && UNITS.includes(parts[0]) && !counting) return run;
		return String(wordsToNumber(run));
	});

/** Chat words that carry nothing: "hey so i paid 600 lol". */
const CHAT_WORDS = words("hey hi hello ok okay so bro dude yaar bhai lol lmao haha pls plz please thx thanks ty guys lets let's basically actually literally yo fyi like");

/** Small words that are never names and are trimmed from the ends of a description. */
const FILLER = words(
	"a an the for on of at to towards in into and & with by from between among amongst split splitting divide divided " +
		"shared share sharing as it its this that is was are were our your my his total worth just only about around approx some " +
		"per head person month every each then also plus : - paid pay pays spent got had bought booked covered put " +
		"gave ordered went ate ok please add adding added paying thing new expense expenses again ratio whole entire too still back up only",
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
	[CHAT_WORDS, SUBJECT_PRONOUNS, SHARE_LINKS, FILLER, THINGS, ALL_WORDS, MONTHLY_WORDS, EQUAL_WORDS, UNEQUAL_WORDS, MONEY_WORDS, PAY_VERBS, OWE_VERBS, LEND_VERBS, HAD_VERBS].flatMap((set) => [...set]),
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

// Words include combining marks (\p{M}), the vowel signs of Hindi, Tamil and other Indic scripts: "चाय" is one word.
const TOKEN = /₹|\$|€|£|¥|%|\d[\d,]*(?:\.\d+)?|\p{L}[\p{L}\p{M}]*(?:['’]\p{L}[\p{L}\p{M}]*)?|[/:&-]/giu;

const isNumber = (t?: Tok) => !!t && /^\d/.test(t.text);
const parseNumber = (s: string) => Number(s.replace(/,/g, ""));

const tokenize = (text: string): Tok[] =>
	(text.match(TOKEN) ?? []).map((text) => ({ text, low: text.toLowerCase().replace("’", "'"), used: false }));

/** Before splitting: spellings that would otherwise be cut in the wrong place. */
/** Hindi, Bengali, Tamil and other Indian (and Arabic) digits, as 0-9. Those blocks start at x0 (Arabic) or x6. */
const INDIC_DIGIT = /[\u0660-\u0669\u06f0-\u06f9\u0966-\u096f\u09e6-\u09ef\u0a66-\u0a6f\u0ae6-\u0aef\u0b66-\u0b6f\u0be6-\u0bef\u0c66-\u0c6f\u0ce6-\u0cef\u0d66-\u0d6f]/g;
const asciiDigit = (d: string) => String((d.charCodeAt(0) % 16) - (d.charCodeAt(0) < 0x900 ? 0 : 6));

const normalize = (text: string) =>
	text
		.replace(INDIC_DIGIT, asciiDigit)
		.replace(/\brs\.\s*/gi, "rs ")
		.replace(/\/-/g, " ")
		.replace(/\bb\/w\b/gi, "between")
		.replace(/\bw\/\s*|\bw(?= )/gi, "with ")
		.replace(/ (?:n|&|\+) /gi, " and ")
		.replace(/\bbtwn?\b/gi, "between")
		.replace(/\bso{2,}\b/gi, "so")
		.replace(/\b(?:picked up|got|footed|settled|took care of) the (?:bill|tab|check)\b/gi, "paid")
		.replace(/\b(?:has|have|needs?) to (?:give|pay|return) me\b/gi, "owes me")
		.replace(/\bneed to pay\b/gi, "owe")
		.replace(/\bwid\b/gi, "with")
		.replace(/\bjus\b/gi, "just")
		.replace(/\bteh\b/gi, "the")
		.replace(/\bon (?:my|his|her|their) card\b/gi, "")
		.replace(/,?\s*\b(?:will|i'll|he'll|she'll|they'll) (?:return it|pay (?:me |you )?back)\b/gi, "")
		.replace(/\b(pays?|covers?|takes?) half\b/gi, "$1 50%")
		.replace(/\/\s*(?:mo|month)\b/gi, " monthly")
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
/** Noon of a real calendar day; "31/02" is no day at all, so it never rolls into March. */
const calendarDay = (y: number, m: number, d: number) => (new Date(y, m, d, 12).getDate() === d ? noon(y, m, d) : undefined);

/** Finds a date in the piece and uses up its words. Dates are always in the past. */
function readDate(toks: Tok[], now: number): number | undefined {
	const today = new Date(now);
	const [y, m, d] = [today.getFullYear(), today.getMonth(), today.getDate()];
	const daysAgo = (n: number) => noon(y, m, d - n);
	// A day still to come means the `earlier` one (last month or last year), if there is one.
	const past = (date?: number, earlier?: number) => (date === undefined ? undefined : date <= now ? date : earlier);
	for (let i = 0; i < toks.length; i++) {
		const t = toks[i];
		const next = toks[i + 1];
		const done = (...used: (Tok | undefined)[]) => used.forEach((u) => u && (u.used = true));
		if (t.low === "today" || t.low === "tonight") return done(t), daysAgo(0);
		if (t.low === "this" && ["morning", "afternoon", "evening"].includes(next?.low ?? "")) return done(t, next), daysAgo(0);
		if (t.low === "yesterday's") return done(t), daysAgo(1);
		if (t.low === "yesterday") return toks[i - 1]?.low === "before" ? (done(t, toks[i - 1], toks[i - 2]), daysAgo(2)) : (done(t), daysAgo(1));
		if (t.low === "last" && next?.low === "night") return done(t, next), daysAgo(1);
		const sinceLast = (weekday: number) => daysAgo(((today.getDay() - weekday + 6) % 7) + 1);
		const weekday = next ? WEEKDAYS.indexOf(next.low.replace(/'s$/, "")) : -1;
		if ((t.low === "last" || t.low === "on") && weekday >= 0) {
			const part = toks[i + 2] && ["night", "morning", "evening", "afternoon"].includes(toks[i + 2].low) ? toks[i + 2] : undefined;
			return done(t, next, part), sinceLast(weekday);
		}
		// "Tuesday's dinner"
		if (t.low.endsWith("'s") && WEEKDAYS.includes(t.low.slice(0, -2))) return done(t), sinceLast(WEEKDAYS.indexOf(t.low.slice(0, -2)));
		// "3 days ago"
		if (isNumber(t) && /^days?$/.test(next?.low ?? "") && toks[i + 2]?.low === "ago") {
			done(t, next, toks[i + 2]);
			t.role = "date";
			return daysAgo(+t.text);
		}
		// "on 2025-10-05": the year first, as phones and spreadsheets write it.
		const iso = /^(19|20)\d\d$/.test(t.text) && next?.text === "-" && isDay(toks[i + 2]) && +toks[i + 2].text <= 12 && toks[i + 3]?.text === "-" && isDay(toks[i + 4]);
		if (iso) {
			done(toks[i - 1]?.low === "on" ? toks[i - 1] : undefined, t, next, toks[i + 2], toks[i + 3], toks[i + 4]);
			[t, toks[i + 2], toks[i + 4]].forEach((u) => (u.role = "date"));
			return past(calendarDay(+t.text, +toks[i + 2].text - 1, +toks[i + 4].text));
		}
		if (!isDay(t)) continue;
		// "on 5/10", or "15/10" first: day first, as written in India. "12/25" can only be month first.
		const second = next?.text === "/" && isDay(toks[i + 2]) ? +toks[i + 2].text : 0;
		const [sDay, sMonth] = second <= 12 ? [+t.text, second] : +t.text <= 12 ? [second, +t.text] : [0, 0];
		if (second && sMonth && (i === 0 || toks[i - 1]?.low === "on")) {
			done(toks[i - 1], t, next, toks[i + 2]);
			t.role = toks[i + 2].role = "date";
			// "25/12/2025": a year after it, too.
			const year = toks[i + 3]?.text === "/" && /^(\d\d|\d{4})$/.test(toks[i + 4]?.text ?? "") ? toks[i + 4] : undefined;
			if (year) {
				done(toks[i + 3], year);
				year.role = "date";
				return past(calendarDay(year.text.length === 2 ? 2000 + +year.text : +year.text, sMonth - 1, sDay));
			}
			return past(calendarDay(y, sMonth - 1, sDay), calendarDay(y - 1, sMonth - 1, sDay));
		}
		// A day of the month needs "th" or a month next to it, so "5 people" stays a count.
		const ordinal = ORDINALS.has(next?.low ?? "") ? next : undefined;
		const after = toks[i + (ordinal ? 2 : 1)];
		const month = isMonth(after) ? monthOf(after) : isMonth(toks[i - 1]) ? monthOf(toks[i - 1]) : -1;
		if (!ordinal && month < 0) continue;
		done(t, ordinal, month >= 0 ? (isMonth(after) ? after : toks[i - 1]) : undefined);
		if (["on", "the"].includes(toks[i - 1]?.low ?? "")) done(toks[i - 1], toks[i - 2]?.low === "on" ? toks[i - 2] : undefined);
		t.role = "date";
		// Not yet this month (or this year): it was last month (or last year).
		const day = +t.text;
		return past(calendarDay(y, month >= 0 ? month : m, day), month >= 0 ? calendarDay(y - 1, month, day) : calendarDay(y, m - 1, day));
	}
	return undefined;
}

/**
 * Marks every number as money, a percentage, a head count or a ratio, and uses
 * up the words around it. `moneyBefore`: an earlier piece gave the amount
 * ("Dinner 2400 split between me and Asha 50 50").
 */
function classifyNumbers(toks: Tok[], moneyBefore = false) {
	const hasMoney = () => moneyBefore || toks.some((u) => u.role === "money");
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
			if (parts.every((p) => parseNumber(p.text) <= 100) && parts.some((p) => parseNumber(p.text) > 0)) {
				t.ratio = parts.map((p) => parseNumber(p.text));
				parts.forEach((p) => Object.assign(p, { role: "ratio", used: true }));
				continue;
			}
			// Not a ratio after all: put the separators back.
			for (let k = i + 1; k < j; k += 2) toks[k].used = false;
		}

		// "split 80 20": two bare numbers making 100 after an amount
		if (isNumber(next) && !next.role && parseNumber(t.text) + parseNumber(next.text) === 100 && hasMoney()) {
			t.ratio = [parseNumber(t.text), parseNumber(next.text)];
			[t, next].forEach((p) => Object.assign(p, { role: "ratio", used: true }));
			continue;
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
		} else if (prev?.low === "of" && ["group", "party", "team", "gang"].includes(toks[i - 2]?.low ?? "")) {
			// "for a group of 6"
			Object.assign(t, { role: "ways", value });
			[prev, toks[i - 2]].forEach((u) => (u.used = true));
		} else if (prev && !next && (["between", "among"].includes(prev.low) || (["for", "by"].includes(prev.low) && value <= 50 && (hasMoney() || DIVIDE_WORDS.has(toks[i - 2]?.low ?? ""))))) {
			// "between 4", "450 each for 4", "shared by 2", "divide by 4"
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
	/** "paid 450 for parking": nobody named, so the person typing. */
	iPaid?: boolean;
	/** Owed, lent or borrowed money. */
	loan?: boolean;
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

const isCapitalised = (t: Tok) => /^\p{Lu}\p{L}/u.test(t.text);
const isWord = (t?: Tok) => !!t && /^\p{L}/u.test(t.text);

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

/** `inExpense`: an earlier piece already gave the total, so "Pranav pays 1100" is a share of it. */
function readPiece(text: string, names: Names, listOpen: boolean, now: number, inExpense = false): Bit {
	const toks = tokenize(text);
	const bit: Bit = { lists: [], shares: [], description: "" };
	bit.date = readDate(toks, now);
	classifyNumbers(toks, inExpense);
	const use = (t: Tok) => (t.used = true);
	/** Who a share written before its owner belongs to: "60% Asha", "1200 kriti's", "3000 mine". */
	const nameAfter = (t: Tok, pct: boolean) =>
		pct ? nameOf(t, names, "strict") : t.low === "mine" ? ME : (possessor(t, names, "loose") ?? (["for", "from"].includes(toks[toks.indexOf(t) - 1]?.low) ? nameOf(t, names, "loose") : undefined));
	/** "her train ticket": a pronoun that owns the next word, not a person in a list. */
	const possessive = (i: number) => PRONOUNS.has(toks[i].low) && isWord(toks[i + 1]) && !toks[i + 1].used && toks[i + 1].low !== "and";

	/** Whether token i comes straight after an amount ("2.5 thousand rupees each"). */
	const afterMoney = (i: number) => {
		let j = i - 1;
		while (j >= 0 && (MULTIPLIERS[toks[j].low] || MONEY_WORDS.has(toks[j].low))) j--;
		return toks[j]?.role === "money";
	};

	// Repeats, equal or not, "each"
	toks.forEach((t, i) => {
		const next = toks[i + 1];
		if (CHAT_WORDS.has(t.low)) use(t);
		else if (MONTHLY_WORDS.has(t.low)) (bit.monthly = true), use(t);
		else if (t.low === "month" && ["every", "each", "per", "a", "/"].includes(toks[i - 1]?.low ?? "")) {
			bit.monthly = true;
			use(t), use(toks[i - 1]);
		} else if (OTHER_REPEAT_WORDS.has(t.low)) (bit.otherRepeat = true), use(t);
		else if (EQUAL_WORDS.has(t.low)) (bit.equal = true), use(t);
		else if (UNEQUAL_WORDS.has(t.low)) (bit.unequal = true), use(t);
		else if (EACH_WORDS.has(t.low) && afterMoney(i) && next?.low !== "month") (bit.perHead = true), use(t);
		else if ((t.low === "per" || t.low === "a") && next && ["head", "person", "pax"].includes(next.low) && afterMoney(i)) {
			bit.perHead = true;
			use(t), use(next);
		}
	});

	// "my share 2500", "Pranav pays 1100": an amount right after a name and a linking word is a share, not the total.
	const shareAt = (i: number, linkedOnly = false) => {
		let j = i - 1;
		while (j >= 0 && MONEY_WORDS.has(toks[j].low)) j--;
		const link = toks[j];
		while (j >= 0 && SHARE_LINKS.has(toks[j].low)) j--;
		// "my share 600", "Neeraj's 1200", "his 3000"
		const linked = (link !== toks[j] && isWord(link)) || !!(link && (possessor(link, names) || ["his", "her", "their"].includes(link.low)));
		if (linkedOnly && !linked) return undefined;
		const t = toks[j];
		const name = t?.low === "my" ? ME : SUBJECT_PRONOUNS.has(t?.low ?? "") || t?.low === "his" ? PAYER : t && (nameOf(t, names, "strict") ?? possessor(t, names));
		// A name already in a list can still be given a share: "with Neeraj paying 1400".
		return name && (!t.used || linked) ? { name, from: j } : undefined;
	};
	const firstMoney = toks.find(
		(t, i) => t.role === "money" && !(inExpense && (shareAt(i, true) || (toks[i + 1] && (toks[i + 1].low === "mine" || possessor(toks[i + 1], names, "loose"))))),
	);
	bit.ratio = toks.find((t) => t.ratio)?.ratio;
	const ways = toks.find((t) => t.role === "ways");
	if (ways) bit.ways = ways.value;

	// "X paid", "paid by X", "X owes me", "I lent X", "Rahul and I had"
	// ("Kiran pays 50%" and "Ravi owes 1600" are shares, read below.)
	const v = toks.findIndex((t, i) => isVerb(t) && !(toks[i + 1]?.role === "pct" || (SHARE_LINKS.has(t.low) && toks[i + 1]?.role === "money" && toks[i + 1] !== firstMoney)));
	if (v >= 0) {
		const verb = toks[v];
		use(verb);
		// The subject: names written just before the verb.
		const subject: string[] = [];
		for (let j = v - 1; j >= 0 && !toks[j].used; j--) {
			if (["and", "&", "still", "also", "just", "already"].includes(toks[j].low)) continue;
			const n = nameOf(toks[j], names, "loose");
			if (!n) break;
			subject.unshift(n);
			use(toks[j]);
		}
		/** Who the verb was done to: "owes Asha", "paid back Mrunal". */
		const object = (slot: Slot = "loose") => {
			const t = toks[v + 1]?.low === "back" ? toks[v + 2] : toks[v + 1];
			const n = nameOf(t, names, slot);
			if (n) use(t);
			return n === PAYER ? undefined : n;
		};
		bit.loan = OWE_VERBS.has(verb.low) || LEND_VERBS.has(verb.low) || BORROW_VERBS.has(verb.low);
		if (OWE_VERBS.has(verb.low)) {
			bit.payer = object();
			if (!SUBJECT_PRONOUNS.has(toks[v - 1]?.low ?? "")) bit.lists.push({ kind: "exact", names: subject.length ? subject : [ME] });
		} else if (LEND_VERBS.has(verb.low)) {
			bit.payer = subject[0] ?? ME;
			const to = toks.findIndex((t, j) => j > v && t.low === "to" && nameOf(toks[j + 1], names, "loose"));
			const o = object() ?? (to >= 0 ? (use(toks[to]), use(toks[to + 1]), nameOf(toks[to + 1], names, "loose")) : undefined);
			if (o) bit.lists.push({ kind: "exact", names: [o] });
		} else if (BORROW_VERBS.has(verb.low)) {
			const from = toks.findIndex((t, j) => j > v && t.low === "from");
			const lender = from >= 0 ? nameOf(toks[from + 1], names, "loose") : undefined;
			if (lender) use(toks[from]), use(toks[from + 1]), (bit.payer = lender);
			if (lender || verb.low !== "took") bit.lists.push({ kind: "exact", names: subject.length ? subject : [ME] });
		} else if (HAD_VERBS.has(verb.low)) {
			if (subject.length) bit.lists.push({ kind: "implicit", names: subject });
		} else if (toks[v + 1]?.low !== "by") {
			// "Asha paid", or "paid 450 for parking": the person typing paid (unless "... and paid by Aditya").
			// "Tanya and I got coffee": the people who had it.
			if (subject.length > 1) bit.lists.push({ kind: "implicit", names: subject });
			else if (subject.length) bit.payer = subject[0];
			else bit.iPaid = true;
			// "Tarun paid me back 1000", "paid Mrunal 1500": money handed to someone.
			const o = object("strict");
			if (o) bit.lists.push({ kind: "exact", names: [o] }), (bit.loan = true);
		}
		// "Paid Ronit's ticket", "Swara covered my share of the concert": it was for them alone.
		if (PAY_VERBS.has(verb.low) || LEND_VERBS.has(verb.low)) {
			const i = toks.findIndex((t, j) => j > v && !t.used && (t.low === "my" || possessor(t, names, "loose")) && isWord(toks[j + 1]));
			if (i >= 0) {
				bit.lists.push({ kind: "exact", names: [toks[i].low === "my" ? ME : possessor(toks[i], names, "loose")!] });
				use(toks[i]);
				if (["share", "part", "portion"].includes(toks[i + 1].low)) {
					use(toks[i + 1]);
					if (toks[i + 2]?.low === "of") use(toks[i + 2]);
				}
			}
		}
	}

	// "by X": "paid by Asha"; "on X": "snacks were on Anushka", "this one's on me"
	toks.forEach((t, i) => {
		if (t.low === "on" && ["is", "was", "were", "are", "'s"].includes(toks[i - 1]?.low ?? "") && !bit.payer) {
			const n = nameOf(toks[i + 1], names, "loose");
			if (n) (bit.payer = n), use(toks[i - 1]), use(t), use(toks[i + 1]);
		}
		if (t.low !== "by" || bit.payer) return;
		const n = nameOf(toks[i + 1], names, "loose");
		if (n) (bit.payer = n), use(t), use(toks[i + 1]);
	});

	// Lists: "between me, Asha", "with Rahul", "for me and Ben", "among all of us"
	const hasStrongList = toks.some((t) => STRONG_LIST.has(t.low));
	toks.forEach((t, i) => {
		if (t.used) return;
		// "2760: 1000 for me" is a share, read below. "1000 from Rehana" is who it's for.
		const share = toks[i - 1]?.role === "money" && toks[i - 1] !== firstMoney;
		const isFor = t.low === "for" || (t.low === "from" && toks[i - 1]?.role === "money");
		const kind: ListKind | undefined = STRONG_LIST.has(t.low) ? (t.low === "with" ? "with" : "exact") : isFor && !hasStrongList && !share ? "for" : undefined;
		if (!kind) return;
		// After "for", only someone clearly a person ("for Ben", not "for Biryani"), unless the
		// names around them make it clear: "for Ezinne and me", "for me & sunny & pinto", "for Ronit only".
		let end = i + 1;
		while (isWord(toks[end + 2]) && ["and", "&"].includes(toks[end + 1]?.low ?? "")) end += 2;
		const run = toks.slice(i + 1, end + 1).filter((u) => u.low !== "and" && u.low !== "&");
		const clear = kind !== "for" || toks[end + 1]?.low === "only" || (run.length > 1 && run.some((u) => nameOf(u, { known: new Map(names.known) }, "lead")));
		const listed: string[] = [];
		let j = i + 1;
		let everyone = false;
		for (; j < toks.length; j++) {
			const u = toks[j];
			if (u.used && u.role !== "ways") break;
			if (u.role === "ways") continue;
			if (u.low === "and" || u.low === "&" || u.low === "the" || (u.low === "of" && everyone)) continue;
			if (possessive(j)) {
				use(u);
				break;
			}
			if (ALL_WORDS.has(u.low)) {
				everyone = true;
				use(u);
				continue;
			}
			const n = nameOf(u, names, clear && j <= end ? "loose" : "lead");
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

	// "the rest is mine": whoever was given a share, plus me.
	toks.forEach((t, i) => {
		const mine = toks.slice(i + 1, i + 3).find((u) => u.low === "mine" || u.low === "me");
		if (t.low === "rest" && mine) bit.lists.push({ kind: "exact", names: [ME] }), [t, mine, toks[i + 1]].forEach(use);
	});

	// Shares stated after the amount: "Asha 1500 Ben 900", "my share 400", "Ben 70%", "60% Asha"
	toks.forEach((t, i) => {
		if (!(t.role === "pct" || (t.role === "money" && t !== firstMoney))) return;
		const at = shareAt(i);
		let after = toks.find((u, k) => k > i && !u.used);
		// "1000 for me, 880 for Lalit"
		if ((after?.low === "for" || after?.low === "from") && t.role === "money") use(after), (after = toks[toks.indexOf(after) + 1]);
		const name = at?.name ?? (after && toks.indexOf(after) <= i + 3 ? nameAfter(after, t.role === "pct") : undefined);
		if (!name) return;
		if (at) for (let k = at.from; k < i; k++) use(toks[k]);
		else use(after!);
		bit.shares.push({ name, value: t.value!, pct: t.role === "pct" });
	});

	// A name right before the amount: "Asha 5000 hotel", "Arjun: 780 petrol", "me 30%", and any
	// capitalised word when a known thing follows ("Imran 560 chai").
	const firstNumber = toks.findIndex((t) => t.role === "money" || t.role === "pct");
	const before = toks.slice(0, firstNumber).filter((t) => !t.used && !FILLER.has(t.low));
	if (firstMoney && before.length === 1 && !bit.payer) {
		const thing = toks.slice(toks.indexOf(firstMoney) + 1).find((t) => !t.used);
		const n = nameOf(before[0], names, thing && THINGS.has(thing.low) ? "strict" : "lead");
		if (n) (bit.lead = n), use(before[0]);
	}

	// Names after the amount, with nothing joining them: "Cab 450 me and Rahul"
	if (firstMoney) {
		const after = toks.slice(toks.indexOf(firstMoney) + 1);
		after.filter((t) => !t.used && ALL_WORDS.has(t.low)).forEach((t) => (use(t), (bit.everyone = true)));
		const implicit: string[] = [];
		after.forEach((t, k) => {
			const joined = implicit.length > 0 && after[k - 1]?.low === "and";
			if (t.low === "myself" && !joined) return use(t);
			const n = !t.used && t.low !== "and" && !possessive(toks.indexOf(t)) && nameOf(t, names, joined ? "loose" : "lead");
			if (n) implicit.push(n), use(t);
		});
		if (implicit.length) {
			bit.lists.push({ kind: "implicit", names: implicit });
			if (after.every((t) => t.used || t.low === "and")) bit.openList = "implicit";
		}
	}

	// A piece that is only names: the rest of a list, or who it was for ("everyone").
	if (v < 0 && !toks.some((t) => t.role && t.role !== "ratio")) {
		const rest = toks.filter((t) => !t.used && !FILLER.has(t.low));
		const isAll = (t: Tok) => ALL_WORDS.has(t.low) || t.low === "of";
		const people = rest.filter((t) => !isAll(t));
		// Once the first is clearly someone, the rest of "me and pavitra" are people too.
		const sure = listOpen || !!nameOf(people[0], { known: new Map(names.known) }, "lead");
		const named = people.map((t) => nameOf(t, names, sure ? "loose" : "strict"));
		if (rest.length && named.every(Boolean)) {
			rest.forEach(use);
			if (named.length) (bit.namesOnly = named as string[]), (bit.openList ??= "implicit");
			else bit.everyone = true;
		}
	}

	if (firstMoney) bit.amount = firstMoney.value;
	bit.description = describe(toks);
	return bit;
}

/** The name in a possessive: "Tanya's" is Tanya. */
function possessor(t: Tok, names: Names, slot: Slot = "strict") {
	if (!t.low.endsWith("'s")) return undefined;
	const text = t.text.slice(0, -2);
	return nameOf({ text, low: text.toLowerCase(), used: false }, names, slot);
}

/** A description that is really one capitalised name, remembered as one. */
function loneName(description: string, names: Names) {
	const [t] = tokenize(description);
	return description === t?.text && isCapitalised(t) ? nameOf(t, names, "strict") : undefined;
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
	b.amount !== undefined || b.payer || b.iPaid || b.lead || b.lists.length || b.namesOnly || b.everyone || b.ways || b.ratio ||
	b.shares.length || b.equal || b.unequal || b.monthly || b.otherRepeat || b.date;

// ---------------------------------------------------------------------------
// Sentence → expenses

type Building = {
	bits: Bit[];
	amount?: number;
	perHead?: boolean;
	payer?: string;
	iPaid?: boolean;
	loan?: boolean;
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

const SEPARATOR = /(\s*(?:,(?!\d)|;|\n|\.(?=\s|$)|\s(?:and|&|then|also|plus|-)\s)\s*)/i;

/** Splits a sentence at commas, "and", full stops and new lines, joining back bits that are only words. */
function pieces(text: string, names: Names, now: number): string[] {
	const parts = text.split(SEPARATOR);
	const out: { text: string; sep: string }[] = [];
	for (let i = 0; i < parts.length; i += 2) {
		if (parts[i].trim()) out.push({ text: parts[i].trim(), sep: parts[i - 1] ?? " " });
	}
	// "drinks and snacks 800": "drinks" alone means nothing, so it belongs with a neighbour.
	const known = () => ({ known: new Map(names.known) });
	for (let i = 0; i < out.length; i++) {
		const b = readPiece(out[i].text, known(), false, now);
		const next = out[i + 1];
		const nextFirst = next ? tokenize(next.text)[0] : undefined;
		const wordsNext = !!nextFirst && !isNumber(nextFirst) && !nameOf(nextFirst, known(), "strict");
		// "Popcorn and cola 460" (no one we know of) and "this morning chai and poha" start a description.
		const loose = wordsNext && /^\p{Ll}/u.test(nextFirst!.text);
		const weakNames = loose && i === 0 && /and/i.test(next!.sep) && b.namesOnly?.every((n) => !nameOf(tokenize(n)[0], known(), "lead"));
		const weakDate = loose && !!b.description;
		if (hasMeaning({ ...b, namesOnly: weakNames ? undefined : b.namesOnly, date: weakDate ? undefined : b.date }) || out.length === 1) continue;
		// Forward when the next piece starts with more words ("snacks 800"), back when it starts with someone ("Ben paid").
		if (next && wordsNext) {
			next.text = out[i].text + next.sep + next.text;
			next.sep = out[i].sep;
			out.splice(i--, 1);
		} else if (i > 0) {
			out[i - 1].text += out[i].sep + out[i].text;
			out.splice(i--, 1);
		}
	}
	// "for Vedika, Sparsh and me": a list after "for" carries on over the pieces that are only names.
	for (let i = 0; i < out.length - 1; i++) {
		const next = readPiece(out[i + 1].text, known(), true, now);
		if (/\bfor\s+\p{L}[\p{L}\p{M}]*$/u.test(out[i].text) && next.namesOnly && !next.payer) {
			out[i].text += " and " + out[i + 1].text;
			out.splice(i-- + 1, 1);
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
	e.iPaid ||= b.iPaid;
	e.loan ||= b.loan;
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

	// "Goa trip: ..." names the group, unless it's "Arjun: 780 petrol" or "Paid by Farhan: ...".
	let groupName: string | undefined;
	const colon = text.match(/^([^:\d\n]{1,40}):\s*([\s\S]+)$/);
	const prefix = colon ? tokenize(colon[1]) : [];
	const probe = { known: new Map(names.known) };
	if (colon && !(prefix.length === 1 && nameOf(prefix[0], probe, "lead")) && !hasMeaning({ ...readPiece(colon[1], probe, false, now), namesOnly: undefined })) {
		groupName = colon[1].trim();
		text = colon[2];
	}

	const expenses: Building[] = [];
	let pending = emptyBuilding();
	let cur: Building | undefined;
	let trailing: Bit[] = [];
	let open: ListKind | undefined;

	const parts = pieces(text, names, now);
	/** "880 for Lalit": the one person a piece is for. */
	const soleFor = (b: Bit) => (!b.description && b.lists.length === 1 && b.lists[0].kind === "for" && b.lists[0].names.length === 1 ? b.lists[0].names[0] : undefined);
	/** "Dinner 4200, Prateek 2200 and Ira 2000": name-and-amount pieces from here on that add up to what's left. */
	const addsUp = (from: number, b: Bit, left: number) => {
		const probe = { known: new Map(names.known) };
		let sum = 0;
		for (let i = from; i < parts.length && sum < left - 0.005; i++) {
			const p = i === from ? b : readPiece(parts[i], probe, false, now, true);
			if (p.amount === undefined || p.payer || !(soleFor(p) || (p.lead ? !p.description : loneName(p.description, probe)))) return false;
			sum += p.amount;
		}
		return Math.abs(sum - left) < 0.005;
	};

	for (const [i, piece] of parts.entries()) {
		const b = readPiece(piece, names, !!open, now, cur?.amount !== undefined);
		const target = cur ?? pending;

		if (b.namesOnly && open) {
			// The rest of a list: "split between me", "Asha", "Ben"
			const list = [...target.lists].reverse().find((l) => l.kind === open);
			if (list) list.names.push(...b.namesOnly);
			else target.lists.push({ kind: open, names: b.namesOnly });
			target.ratio ??= b.ratio;
			continue;
		}

		// "split 60/40, Mayank 60 and me 40": the parts of the ratio, by name.
		const ratioName = b.amount !== undefined && cur?.ratio?.includes(b.amount) && !b.payer && (b.lead ? !b.description && b.lead : loneName(b.description, names));
		if (ratioName && cur) {
			cur.shares.push({ name: ratioName, value: b.amount!, pct: true });
			open = undefined;
			continue;
		}

		const fits =
			b.amount !== undefined && !b.payer && cur?.amount !== undefined && sharedTotal(cur) + b.amount <= cur.amount + 0.005;
		// Inside a list of shares, or one that adds up to the total, any capitalised word can be the name: "- Asha 1000, Zuvoka 800".
		const shareName =
			fits &&
			(b.lead
				? !b.description && b.lead
				: (cur!.shares.length > 0 || addsUp(i, b, cur!.amount! - sharedTotal(cur!))) && (soleFor(b) || loneName(b.description, names)));
		if (shareName && cur) {
			cur.shares.push({ name: shareName, value: b.amount!, pct: false }, ...b.shares);
			open = undefined;
		} else if (b.amount !== undefined) {
			cur = pending.bits.length ? pending : emptyBuilding();
			pending = emptyBuilding();
			if (b.lead && open && !b.payer) b.lists.push({ kind: open, names: [b.lead] });
			else if (b.lead && !b.payer) cur.payer = b.lead;
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
	// "€50 and taxi £20": two currencies, so neither amount can be taken as the group's.
	const currencies = new Set(tokenize(text).flatMap((t) => CURRENCY_WORDS[t.low] ?? []));
	if (currencies.size > 1) drafts.forEach((d) => d.unsure.includes("amount") || d.unsure.push("amount"));
	return { groupName, ...(currencies.size === 1 ? { currency: [...currencies][0] } : {}), expenses: drafts };
}

/** Turns what was gathered for one expense into a QuickExpense, noting what was assumed. */
function finish(e: Building, anyMonthly: boolean): QuickExpense {
	const unsure = new Set<QuickField>();
	const payer = e.payer ?? ME;
	if (!e.payer && !e.iPaid) unsure.add("payer");

	// "her", "his share": the payer, or when I paid, the one other person named ("Lunch with Sid, his share 500").
	const others = [...new Set(e.lists.flatMap((l) => l.names).filter((n) => n !== ME && n !== PAYER))];
	const them = payer === ME && others.length === 1 ? others[0] : payer;
	const listed: string[] = [];
	const add = (n: string) => {
		const name = n === PAYER ? them : n;
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
	const byName = (list: Bit["shares"]) => Object.fromEntries(list.map((s) => [s.name === PAYER ? them : s.name, s.value]));
	if (e.ratio && pcts.length === e.ratio.length && !amounts.length) {
		split = { method: "percentage", weights: byName(pcts) };
	} else if (e.ratio && Array.isArray(participants) && participants.length === e.ratio.length) {
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

	const description = e.description ? e.description.charAt(0).toUpperCase() + e.description.slice(1) : e.loan ? "Loan" : "";
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

export type QuickResolved = { groupName?: string; currency?: string; people: QuickPerson[]; expenses: QuickResolvedExpense[] };

/** Key of the person typing when the group doesn't know who that is yet. */
export const NEW_ME = "new:me";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Matches names to the group's members (whole name, or a unique first name),
 * adds anyone new, and fills in what the text implied: "everyone", "3 ways",
 * and the shares nobody stated. `members` is empty for a new group, which
 * takes the currency the text wrote; in a group with another `currency`
 * ("₹2400" in a dollar group) the amounts are flagged instead.
 */
export function resolveQuickAdd(draft: QuickDraft, members: Person[], meId?: string | null, currency?: string): QuickResolved {
	const otherCurrency = !!draft.currency && !!currency && draft.currency !== currency;
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
		// "Asha" when the group has Asha Rao and Asha Iyer: new, but quite likely one of them.
		const lookalike = people.some((p) => !p.isNew && p.name.toLowerCase().split(/\s+/)[0] === low);
		people.push({ key, name, isNew: true, isMe: false, unsure: lookalike });
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
		if (otherCurrency) unsure.add("amount");
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
			// Whatever nobody stated is shared equally by the others, the last taking the rounding so it adds up.
			rest.forEach((k, i) => (weights![k] = round2(i < rest.length - 1 ? left / rest.length : left - round2(left / rest.length) * i)));
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

	return { groupName: draft.groupName, ...(members.length || !draft.currency ? {} : { currency: draft.currency }), people, expenses };
}
