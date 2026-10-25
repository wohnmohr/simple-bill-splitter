/**
 * The one address the site lives at. splitbiller.com redirects here, so canonicals,
 * the sitemap and robots.txt must all name this host or Google sees every listed
 * page as a redirect and won't index it. Deliberately not an env var: previews then
 * point search engines at production instead of at themselves.
 */
export const SITE_URL = "https://www.splitbiller.com";
