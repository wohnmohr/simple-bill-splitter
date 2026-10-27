/** Sites a pasted link may come from: the browser it was copied in may be on either host. */
const HOSTS = ["splitbiller.com", "www.splitbiller.com"];

/** Pages that open a link's encrypted data: a recovery link (/r) or a group link (/g). */
const PAGES = ["/r", "/g"];

/**
 * The page to open for a SplitBiller link pasted into the app, or null if the text holds none.
 * Takes the first URL in the text, so a whole WhatsApp message works. Only our own hosts and
 * pages are opened, and the #key must be there: without it the link can't open anything.
 */
export function pastedLinkPath(text: string, origin: string): string | null {
	const found = text.match(/https?:\/\/\S+/)?.[0];
	if (!found) return null;
	let url: URL;
	try {
		url = new URL(found);
	} catch {
		return null;
	}
	const ours = url.origin === origin || (url.protocol === "https:" && HOSTS.includes(url.hostname));
	if (!ours || !PAGES.includes(url.pathname) || url.hash.length < 2) return null;
	return `${url.pathname}${url.search}${url.hash}`;
}
