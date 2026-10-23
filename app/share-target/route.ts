// A screenshot shared to the installed app before its service worker is registered
// (public/sw.js takes the share once it is): the image is lost, but Add expense still opens.
export function POST() {
	return new Response(null, { status: 303, headers: { Location: "/dashboard?add" } });
}
