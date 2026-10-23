// Tests for the "you owe me" WhatsApp message used by reminders and the first-expense send.
//   node --test --experimental-strip-types scripts/owe-message.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { oweMessage } = await import("../utils/whatsapp.ts");

test("the message names what's owed, the UPI ID when there is one, and the link", () => {
	assert.equal(
		oweMessage("Riya", "I added Dinner on SplitBiller", "₹400", "https://x/g?settle#k", { id: "me@upi", amount: 400 }),
		"Hi Riya, I added Dinner on SplitBiller: you owe me ₹400.\nUPI: me@upi\nSee it and pay here: https://x/g?settle#k"
	);
	assert.equal(oweMessage("Kabir", "a reminder for Goa", "₹10", "u"), "Hi Kabir, a reminder for Goa: you owe me ₹10.\nSee it and pay here: u");
});

test("above ₹2,000 the message says to pay the UPI ID from inside the app", () => {
	assert.equal(
		oweMessage("Riya", "a reminder for Goa", "₹2,300", "u", { id: "me@upi", amount: 2300 }),
		"Hi Riya, a reminder for Goa: you owe me ₹2,300.\nUPI: me@upi\nOver ₹2,000, UPI apps can block pay links. If yours does, pay the UPI ID from inside the app.\nSee it and pay here: u"
	);
});
