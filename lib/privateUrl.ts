/**
 * Pages that carry private data: in the URL fragment (split, group and backup
 * keys, shared groups), or on screen in attributes replay can't mask (the app's
 * aria-labels and UPI pay links name people, amounts and UPI IDs). Never recorded.
 */
const PRIVATE_PATH = /^\/(s|g|r|dashboard|pay-story|share|secret-santa)(\/|$)/;
export const isPrivatePath = (path: string) => PRIVATE_PATH.test(path);

/** A cloud split's id. With the #key it opens the split, so it never leaves the browser. */
const SPLIT_PATH = /\/s\/[A-Za-z0-9_-]{22}(?=[/?]|$)/;

/**
 * A URL or path safe to send to analytics and feedback: no #fragment, and a
 * split page reads "/s/[id]" instead of its id.
 */
export const scrubUrl = (url: string) => url.split("#")[0].replace(SPLIT_PATH, "/s/[id]");

/** Browsers quote the text that failed ("Unexpected token 'R', \"Rahul paid…\" is not valid JSON"). */
const QUOTED = /"[^"]*"|'[^']*'|`[^`]*`|“[^”]*”/g;

/**
 * An error message safe to send: quoted text (which can be a name, amount or
 * UPI ID the app was reading), long digit runs and anything past 200
 * characters are gone. What's left still says what kind of error it was.
 */
export const scrubErrorText = (message: string) =>
	scrubUrl(message.replace(QUOTED, "…").replace(/\d{4,}/g, "…").replace(/[\w.+-]+@[\w.-]+/g, "[upi]").slice(0, 200));
