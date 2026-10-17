/** The Android app's package name on Google Play. It can never change once published. */
export const ANDROID_PACKAGE = "com.splitbiller.app";

const FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

/**
 * Digital Asset Links proving the Play Store app and splitbiller.com belong
 * together, so the app opens the site full screen with no browser bar.
 * `fingerprints` is a comma-separated list of SHA-256 signing certificate
 * fingerprints from Play Console; anything malformed is dropped.
 */
export function assetLinks(fingerprints = "") {
	const sha256_cert_fingerprints = fingerprints
		.split(",")
		.map((f) => f.trim().toUpperCase())
		.filter((f) => FINGERPRINT.test(f));
	if (!sha256_cert_fingerprints.length) return [];
	return [
		{
			relation: ["delegate_permission/common.handle_all_urls"],
			target: { namespace: "android_app", package_name: ANDROID_PACKAGE, sha256_cert_fingerprints },
		},
	];
}
