/** Pages whose URL fragment carries private data (split keys, shared groups). Never recorded. */
const PRIVATE_PATH = /^\/(s|pay-story|share|secret-santa)(\/|$)/;
export const isPrivatePath = (path: string) => PRIVATE_PATH.test(path);

/** A cloud split's id. With the #key it opens the split, so it never leaves the browser. */
const SPLIT_PATH = /\/s\/[A-Za-z0-9_-]{22}(?=[/?]|$)/;

/**
 * A URL or path safe to send to analytics and feedback: no #fragment, and a
 * split page reads "/s/[id]" instead of its id.
 */
export const scrubUrl = (url: string) => url.split("#")[0].replace(SPLIT_PATH, "/s/[id]");
