// Resolves the app's "@/..." imports for tests that load modules using them.
// Use: register("./fixtures/alias.mjs", import.meta.url), then import dynamically.
export async function resolve(specifier, context, next) {
	if (!specifier.startsWith("@/")) return next(specifier, context);
	const base = new URL(`../../${specifier.slice(2)}`, import.meta.url).href;
	for (const suffix of [".ts", "/index.ts"]) {
		try {
			return await next(base + suffix, context);
		} catch {
			/* try the next form */
		}
	}
	return next(specifier, context);
}
