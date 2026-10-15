/**
 * Opens WhatsApp with `text` ready to send.
 *
 * Our links keep their keys after the "#" (groups, splits, Secret Santa), so
 * they never reach a server. A wa.me link would undo that: the whole message,
 * keys included, travels to WhatsApp's web server in the query string.
 * whatsapp:// hands the message straight to the app on this device instead.
 */
export const whatsAppUrl = (text: string) => `whatsapp://send?text=${encodeURIComponent(text)}`;

export const openWhatsApp = (text: string) => {
	window.location.href = whatsAppUrl(text);
};
