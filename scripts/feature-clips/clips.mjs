// The clips on /features. Each one starts from a fresh browser; see rec.mjs for how to run.
import { BASE, beat, browser, capture, encode, phone, type } from "./rec.mjs";

/** Builds a group off camera, the fast way, and leaves the page on it. */
async function setupGroup(page, { name = "Goa trip", members, expenses = [] }) {
	await page.goto(`${BASE}/dashboard`);
	await page.getByRole("button", { name: /create/i }).first().click();
	await page.getByLabel("Group name").fill(name);
	await page.getByRole("button", { name: "Create group" }).click();
	await page.getByRole("button", { name: "Add members" }).first().click();
	for (const [n, upi] of members) {
		await page.getByLabel("Name", { exact: true }).fill(n);
		if (upi) await page.getByPlaceholder(/UPI ID/).first().fill(upi);
		await page.getByRole("button", { name: "Add member", exact: true }).click();
	}
	await page.getByRole("button", { name: "Done" }).click();
	for (const [amount, desc, payer] of expenses) {
		await page.getByRole("button", { name: "Add expense" }).first().click();
		const d = page.getByRole("dialog");
		await d.getByLabel("Amount").fill(String(amount));
		await d.getByLabel("What was it for?").fill(desc);
		await d.locator("fieldset").first().getByRole("button", { name: payer, exact: true }).click();
		await d.getByRole("button", { name: "Add expense" }).click();
		await d.waitFor({ state: "detached" });
	}
	await page.reload();
	await page.getByRole("button", { name: new RegExp(name) }).first().click().catch(() => {});
	await page.evaluate(() => document.fonts.ready);
	await beat(page, 500);
}

const MEMBERS = [["Asha", "asha@okaxis"], ["Ben"], ["Chen"], ["Dev"]];
const EXPENSES = [[4800, "Beach villa", "Asha"], [2400, "Seafood dinner", "Ben"], [1200, "Scooter rental", "Chen"], [800, "Fuel", "Asha"]];

const CLIPS = {
	async "create-group"() {
		const p = await phone();
		await p.goto(`${BASE}/dashboard`);
		await p.evaluate(() => document.fonts.ready);
		await beat(p, 400);
		const rec = await capture(p);
		await beat(p, 900);
		await p.getByRole("button", { name: /Create a group/ }).first().click();
		await beat(p, 700);
		await type(p.getByLabel("Group name"), "Goa trip");
		await beat(p, 500);
		await p.getByRole("button", { name: "Create group" }).click();
		await beat(p, 900);
		await p.getByRole("button", { name: "Add members" }).first().click();
		await beat(p, 600);
		for (const [n, upi] of [["Asha", "asha@okaxis"], ["Ben"], ["Chen"]]) {
			await type(p.getByLabel("Name", { exact: true }), n);
			if (upi) { await beat(p, 250); await type(p.getByPlaceholder(/UPI ID/).first(), upi, 55); }
			await beat(p, 300);
			await p.getByRole("button", { name: "Add member", exact: true }).click();
			await beat(p, 450);
		}
		await beat(p, 500);
		await p.getByRole("button", { name: "Done" }).click();
		await beat(p, 2000);
		return encode("create-group", [await rec.stop()]);
	},

	async expenses() {
		const p = await phone();
		await setupGroup(p, { members: MEMBERS.slice(0, 3) });
		const rec = await capture(p);
		await beat(p, 700);
		const d = p.getByRole("dialog");
		await p.getByRole("button", { name: "Add expense" }).first().click();
		await beat(p, 600);
		await type(d.getByLabel("Amount"), "1200", 110);
		await type(d.getByLabel("What was it for?"), "Hotel");
		await beat(p, 300);
		await d.locator("fieldset").first().getByRole("button", { name: "Asha", exact: true }).click();
		await beat(p, 700);
		await d.getByRole("button", { name: "Add expense" }).click();
		await beat(p, 1100);
		await p.getByRole("button", { name: "Add expense" }).first().click();
		await beat(p, 600);
		await type(d.getByLabel("Amount"), "900", 110);
		await type(d.getByLabel("What was it for?"), "Dinner");
		await beat(p, 300);
		await d.locator("fieldset").first().getByRole("button", { name: "Ben", exact: true }).click();
		await beat(p, 500);
		await d.getByText("By percentage", { exact: true }).click();
		await beat(p, 700);
		for (const [n, v] of [["Asha", "50"], ["Ben", "25"], ["Chen", "25"]]) {
			const f = d.getByLabel(`${n}'s percentage`);
			await f.click(); await f.press("ControlOrMeta+a"); await f.pressSequentially(v, { delay: 110 });
			await beat(p, 350);
		}
		await beat(p, 500);
		await d.getByRole("button", { name: "Add expense" }).click();
		await beat(p, 2000);
		return encode("expenses", [await rec.stop()]);
	},

	async settle() {
		const p = await phone();
		await setupGroup(p, { members: MEMBERS, expenses: EXPENSES });
		const rec = await capture(p);
		await beat(p, 1000);
		await p.getByRole("tab", { name: /Balances/ }).click();
		await beat(p, 2200);
		await p.getByRole("tab", { name: /Settle up/ }).click();
		await beat(p, 2800);
		return encode("settle", [await rec.stop()]);
	},

	async upi() {
		const p = await phone();
		// The UPI app can't open here; stand in for it by stopping the jump.
		await p.context().addInitScript(() =>
			addEventListener("click", (e) => { if (e.target.closest?.('a[href^="upi:"]')) e.preventDefault(); }, true));
		await setupGroup(p, { members: MEMBERS, expenses: EXPENSES });
		await p.getByRole("tab", { name: /Settle up/ }).click();
		await beat(p, 400);
		const rec = await capture(p);
		await beat(p, 1000);
		await p.getByRole("button", { name: "Dev", exact: true }).click();
		await beat(p, 1600);
		await p.getByRole("link", { name: /with UPI/ }).first().click();
		await beat(p, 1200);
		await p.evaluate(() => dispatchEvent(new Event("focus")));
		await beat(p, 1300);
		await p.getByRole("button", { name: "Yes, mark paid" }).click();
		await beat(p, 2400);
		return encode("upi", [await rec.stop()], { posterAt: 3 }); // poster: the Pay with UPI button
	},

	async share() {
		const p = await phone();
		await setupGroup(p, { members: MEMBERS, expenses: EXPENSES });
		await p.getByRole("tab", { name: /Settle up/ }).click();
		await beat(p, 400);
		const rec = await capture(p);
		await beat(p, 800);
		for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 60); await beat(p, 40); }
		await beat(p, 700);
		await p.getByRole("button", { name: "Copy link" }).click();
		await beat(p, 1200);
		const link = await p.evaluate(() => navigator.clipboard.readText());
		await p.goto(link);
		await p.evaluate(() => document.fonts.ready);
		await beat(p, 1600);
		for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 50); await beat(p, 45); }
		await beat(p, 2000);
		return encode("share", [await rec.stop()]);
	},

	async sync() {
		const a = await phone(), b = await phone();
		await setupGroup(a, { members: MEMBERS.slice(0, 3), expenses: EXPENSES.slice(0, 2).map(([x, d, w]) => [x, d, w === "Dev" ? "Asha" : w]) });
		await b.goto(`${BASE}/dashboard`);
		await b.evaluate(() => document.fonts.ready);
		await beat(a, 400);
		const ra = await capture(a), rb = await capture(b);
		await beat(a, 900);
		await a.getByRole("button", { name: /Share & sync, end-to-end encrypted/ }).click();
		await beat(a, 900);
		await a.getByRole("button", { name: "Turn on sync" }).click();
		await a.locator("#group-link").waitFor();
		await beat(a, 1600);
		const link = await a.locator("#group-link").inputValue();
		await b.goto(link);
		await b.getByRole("heading", { name: "Goa trip" }).waitFor();
		await beat(a, 700);
		await a.keyboard.press("Escape");
		await beat(a, 900);
		const d = b.getByRole("dialog");
		await b.getByRole("button", { name: "Add expense" }).first().click();
		await beat(b, 500);
		await type(d.getByLabel("Amount"), "1500", 100);
		await type(d.getByLabel("What was it for?"), "Sunset cruise", 70);
		await d.locator("fieldset").first().getByRole("button", { name: "Chen", exact: true }).click();
		await beat(b, 400);
		await d.getByRole("button", { name: "Add expense" }).click();
		for (let i = 0; i < 40 && !(await a.getByText("Sunset cruise").count()); i++) {
			await a.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
			await beat(a, 250);
		}
		await beat(a, 2200);
		return encode("sync", [await ra.stop(), await rb.stop()]);
	},

	async themes() {
		const p = await phone();
		await setupGroup(p, { members: MEMBERS, expenses: EXPENSES });
		const rec = await capture(p);
		await beat(p, 900);
		for (const t of ["Midnight", "Terracotta", "Ocean"]) {
			await p.getByRole("button", { name: "Group options" }).click();
			await beat(p, 450);
			await p.getByRole("menuitem", { name: "Theme" }).click();
			await beat(p, 700);
			await p.getByRole("radio", { name: new RegExp(`^${t}`) }).click();
			await beat(p, 800);
			await p.getByRole("button", { name: "Done" }).click();
			await beat(p, 1500);
		}
		return encode("themes", [await rec.stop()], { posterAt: 3.6 }); // poster: the dark Midnight theme
	},

	async "split-link"() {
		const p = await phone();
		await p.goto(`${BASE}/split/dinner`);
		await p.evaluate(() => document.fonts.ready);
		await beat(p, 600);
		const rec = await capture(p);
		await beat(p, 900);
		for (let i = 0; i < 9; i++) { await p.mouse.wheel(0, 50); await beat(p, 40); }
		await beat(p, 500);
		await p.getByRole("button", { name: /More friends/ }).click();
		await beat(p, 700);
		for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 50); await beat(p, 40); }
		await type(p.getByPlaceholder("Your name"), "Priya");
		await type(p.getByPlaceholder(/okaxis/), "priya@okaxis", 50);
		await beat(p, 400);
		await p.getByRole("button", { name: /PRINT SPLIT LINK/i }).click();
		await p.waitForURL(/\/s\//);
		await beat(p, 1500);
		await type(p.getByPlaceholder("Their first name"), "Rahul");
		await beat(p, 300);
		await p.getByRole("button", { name: /Received/ }).click();
		await beat(p, 1300);
		await type(p.getByPlaceholder("Their first name"), "Aisha");
		await beat(p, 300);
		await p.getByRole("button", { name: /Received/ }).click();
		await beat(p, 2200);
		return encode("split-link", [await rec.stop()]);
	},

	async calculators() {
		const p = await phone();
		await p.goto(`${BASE}/restaurant-bill-splitter`);
		await p.evaluate(() => document.fonts.ready);
		await beat(p, 600);
		const rec = await capture(p);
		await beat(p, 900);
		for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 50); await beat(p, 40); }
		await beat(p, 500);
		const amount = p.getByPlaceholder("4850");
		await amount.click(); await amount.press("ControlOrMeta+a"); await amount.pressSequentially("3600", { delay: 110 });
		await beat(p, 500);
		await p.getByRole("button", { name: "10%", exact: true }).click();
		await beat(p, 600);
		const people = p.locator("label", { hasText: "Number of people" }).locator("xpath=following-sibling::*[1]/descendant-or-self::input[1]");
		await people.click(); await people.press("ControlOrMeta+a"); await people.pressSequentially("4", { delay: 110 });
		await beat(p, 600);
		await people.blur();
		await p.getByPlaceholder("Asha, Rohan, Mia, …").click();
		await p.getByPlaceholder("Asha, Rohan, Mia, …").pressSequentially("Asha, Rohan, Mia, Kabir", { delay: 55 });
		await p.getByPlaceholder("Asha, Rohan, Mia, …").blur();
		await beat(p, 500);
		for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, 50); await beat(p, 40); }
		await beat(p, 2200);
		return encode("calculators", [await rec.stop()]);
	},
};

const names = process.argv.slice(2);
for (const name of names.length ? names : Object.keys(CLIPS)) {
	await CLIPS[name]();
}
await browser.close();
