import { overUpiLinkLimit, UPI_LIMIT_TIP } from "@/utils/upi";

/**
 * Sends `text` to WhatsApp without it touching a web server.
 *
 * Our links keep their keys after the "#" (groups, splits, Secret Santa), so
 * they never reach a server. A wa.me or web.whatsapp.com link would undo that:
 * the whole message, keys included, travels in its query string. So phones get
 * whatsapp://, which hands the message straight to the app, and computers
 * (which may not have the app) get the share sheet or the clipboard.
 */
export type WhatsAppResult = "app" | "shared" | "copied" | "failed";

export async function sendViaWhatsApp(text: string): Promise<WhatsAppResult> {
	if (window.matchMedia("(pointer: coarse)").matches) {
		window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
		return "app";
	}
	try {
		if (navigator.share) {
			await navigator.share({ text });
			return "shared";
		}
		await navigator.clipboard.writeText(text);
		return "copied";
	} catch {
		return "failed"; // share cancelled, or clipboard blocked
	}
}

/**
 * "Hi Riya, <about>: you owe me ₹400.", the payee's UPI ID if known (with the
 * pay-in-app tip above ₹2,000), then the link to see it and pay.
 */
export const oweMessage = (name: string, about: string, owed: string, url: string, upi?: { id: string; amount: number }) =>
	[
		`Hi ${name}, ${about}: you owe me ${owed}.`,
		upi ? `UPI: ${upi.id}` : "",
		upi && overUpiLinkLimit(upi.amount) ? UPI_LIMIT_TIP : "",
		`See it and pay here: ${url}`,
	]
		.filter(Boolean)
		.join("\n");
