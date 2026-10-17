import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/Landing/SiteNav";
import { SiteFooter } from "@/components/Landing/SiteFooter";
import { CONTACT_EMAIL } from "@/content/contact";

export const metadata: Metadata = {
	title: "Privacy policy | SplitBiller",
	description: "What SplitBiller stores, what it never sees, and how to delete your data.",
	alternates: { canonical: "/privacy" },
};

const UPDATED = "17 October 2026";

const SECTIONS: { title: string; body: string[] }[] = [
	{
		title: "No account, and your groups stay on your device",
		body: [
			"SplitBiller has no sign-up. Groups, expenses, names and UPI IDs are saved in your browser (or the SplitBiller app) on your device, and nothing leaves it until you choose to share.",
			"Bill and order screenshots you scan are read on your device. The images are never uploaded.",
		],
	},
	{
		title: "Shared groups and split links are end-to-end encrypted",
		body: [
			"When you share, the data is encrypted on your device first. The key is in the part of the link after the #, which is never sent to our servers, so we store only data we can't read. We don't keep your IP address, name or the time alongside it.",
			"Anyone you send the link to can read and change that group, so share it only with the people in it.",
		],
	},
	{
		title: "We never touch your money",
		body: [
			"Payments go directly from one UPI app to another. SplitBiller only fills in the amount and UPI ID; it holds no wallet, balance or payment details.",
		],
	},
	{
		title: "Analytics, with your details masked",
		body: [
			"We use PostHog and Vercel Analytics to count pages and features used, along with device and browser type, so we know what to improve. Names, amounts, group titles, UPI IDs and anything typed are masked before sending, and links that carry group data are never recorded.",
			"PostHog may record anonymous session replays where all text and inputs are hidden. They're switched off on shared group and split pages.",
		],
	},
	{
		title: "Feedback and contact",
		body: [
			"If you send feedback, we store your rating, message and the page you were on. Contact form messages are handled by Tally and emailed to us. To stop abuse, we keep a salted hash of your IP address, never the address itself.",
		],
	},
	{
		title: "What we don't do",
		body: ["We don't sell or share your data, show ads, or use it to track you across other sites or apps."],
	},
	{
		title: "Deleting your data",
		body: [
			"Deleting a group removes it from your device. A shared group stays with the others in it until someone chooses Delete for everyone in its sync settings, which removes the encrypted copy from our servers. Clearing your browser data, or uninstalling the app, removes everything stored on your device.",
			`To have feedback or anything else removed, email ${CONTACT_EMAIL}.`,
		],
	},
	{
		title: "Children",
		body: ["SplitBiller isn't meant for children under 13, and we don't knowingly collect their data."],
	},
	{
		title: "Changes",
		body: ["If this policy changes, we'll update this page and the date above."],
	},
];

export default function PrivacyPage() {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink">
			<SiteNav />

			<header className="px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
				<div className="mx-auto max-w-3xl">
					<p className="label-text">Last updated {UPDATED}</p>
					<h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.5rem)] font-semibold leading-[1.05]">Privacy policy</h1>
					<p className="mt-5 max-w-2xl text-lg text-ink-soft">
						SplitBiller is made by wohnmohr. This page covers splitbiller.com and the SplitBiller app.
					</p>
				</div>
			</header>

			<section className="px-4 pb-16 sm:px-6">
				<div className="mx-auto max-w-3xl space-y-8">
					{SECTIONS.map(({ title, body }) => (
						<div key={title}>
							<h2 className="font-display text-xl font-semibold sm:text-2xl">{title}</h2>
							{body.map((p) => (
								<p key={p} className="mt-2 text-ink-soft">
									{p}
								</p>
							))}
						</div>
					))}
					<p className="text-ink-soft">
						Questions? Email{" "}
						<a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand-700 underline hover:text-brand-800">
							{CONTACT_EMAIL}
						</a>{" "}
						or use the{" "}
						<Link href="/contact" className="font-medium text-brand-700 underline hover:text-brand-800">
							contact page
						</Link>
						.
					</p>
				</div>
			</section>

			<SiteFooter />
		</main>
	);
}
