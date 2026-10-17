import { assetLinks } from "@/utils/assetLinks";

// Read at request time, so setting the fingerprints in Vercel takes effect on the next deploy without a code change.
export const dynamic = "force-dynamic";

export function GET() {
	return Response.json(assetLinks(process.env.ANDROID_CERT_FINGERPRINTS), {
		headers: { "Cache-Control": "public, max-age=3600" },
	});
}
