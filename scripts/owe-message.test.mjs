// Tests for the "you owe me" WhatsApp message used by reminders and the first-expense send.
//   node --test --experimental-strip-types scripts/owe-message.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { oweMessage } from "../utils/whatsapp.ts";

test("the message names what's owed, the UPI ID when there is one, and the link", () => {
	assert.equal(
		oweMessage("Riya", "I added Dinner on SplitBiller", "₹400", "https://x/g?settle#k", "me@upi"),
		"Hi Riya, I added Dinner on SplitBiller: you owe me ₹400.\nUPI: me@upi\nSee it and pay here: https://x/g?settle#k"
	);
	assert.equal(oweMessage("Kabir", "a reminder for Goa", "₹10", "u"), "Hi Kabir, a reminder for Goa: you owe me ₹10.\nSee it and pay here: u");
});
