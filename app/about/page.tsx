import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, IndianRupee, Lock, MapPin, Smartphone } from "lucide-react";
import { SiteNav } from "@/components/Landing/SiteNav";
import { SiteFooter } from "@/components/Landing/SiteFooter";
import { TrackedLink } from "@/components/UI/TrackedLink";

export const metadata: Metadata = {
	title: "About SplitBiller | Who makes it and how it handles your money",
	description:
		"SplitBiller is a free bill splitter for India, made by wohnmohr. It never touches your money, needs no account, and encrypts shared groups end to end.",
	alternates: { canonical: "/about" },
};

const PROMISES = [
	{
		icon: IndianRupee,
		title: "We never touch your money",
		body: "Payments go straight from one UPI app to another. SplitBiller only fills in the amount and the UPI ID, so there's no wallet, no balance held and no payment details on our side.",
	},
	{
		icon: Smartphone,
		title: "No account, and your groups stay on your phone",
		body: "There's nothing to sign up for. Groups are saved in your browser on your device, and you can delete them any time.",
	},
	{
		icon: Lock,
		title: "Shared groups are end-to-end encrypted",
		body: "When you share a group, it's encrypted on your phone before it leaves. The key is in the part of the link after the #, which browsers never send to a server, so we store data we can't read.",
	},
	{
		icon: BarChart3,
		title: "Analytics without your details",
		body: "We count which features get used so we know what to improve. Names, amounts, group titles and UPI IDs are masked before anything is sent.",
	},
	{
		icon: MapPin,
		title: "Built for India, run in India",
		body: "Rupees, UPI and GST come first, and the app's servers run in Mumbai.",
	},
];

export default function AboutPage() {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink">
			<SiteNav />

			<header className="px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
				<div className="mx-auto max-w-3xl">
					<p className="label-text">About</p>
					<h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.5rem)] font-semibold leading-[1.05]">
						Split bills without giving up your privacy
					</h1>
					<p className="mt-5 max-w-2xl text-lg text-ink-soft">
						SplitBiller helps friends, flatmates and travellers work out who owes whom and settle up by UPI. It&apos;s free,
						with no account and no app to install.
					</p>
				</div>
			</header>

			<section aria-labelledby="who" className="border-y border-line bg-surface px-4 py-12 sm:px-6 sm:py-14">
				<div className="mx-auto max-w-3xl">
					<h2 id="who" className="font-display text-2xl font-semibold sm:text-3xl">
						Who&apos;s behind it
					</h2>
					<p className="mt-4 text-ink-soft">
						SplitBiller is built and run by{" "}
						<a
							href="https://www.wohnmohr.com"
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-brand-700 underline hover:text-brand-800"
						>
							wohnmohr
						</a>
						. Messages from the{" "}
						<Link href="/contact" className="font-medium text-brand-700 underline hover:text-brand-800">
							contact page
						</Link>{" "}
						and feature requests go straight to the people who build it, and much of what&apos;s in the app today
						started as one.
					</p>
				</div>
			</section>

			<section aria-labelledby="promises" className="px-4 py-12 sm:px-6 sm:py-16">
				<div className="mx-auto max-w-3xl">
					<h2 id="promises" className="font-display text-2xl font-semibold sm:text-3xl">
						How SplitBiller handles your money and data
					</h2>
					<ul className="mt-8 space-y-6">
						{PROMISES.map(({ icon: Icon, title, body }) => (
							<li key={title} className="flex gap-4">
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
									<Icon className="h-5 w-5" strokeWidth={1.75} />
								</span>
								<div className="min-w-0">
									<h3 className="font-semibold text-ink">{title}</h3>
									<p className="mt-1 text-ink-soft">{body}</p>
								</div>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="px-4 pb-16 sm:px-6">
				<div className="surface mx-auto flex max-w-3xl flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
					<div>
						<h2 className="font-display text-xl font-semibold">Questions, or something not right?</h2>
						<p className="mt-1 text-ink-soft">Write to us. A person reads every message.</p>
					</div>
					<div className="flex shrink-0 flex-wrap gap-2">
						<Link href="/contact" className="btn-secondary">
							Contact us
						</Link>
						<TrackedLink href="/dashboard" location="about" className="btn-primary">
							Open the app <ArrowRight className="h-4 w-4" />
						</TrackedLink>
					</div>
				</div>
			</section>

			<SiteFooter />
		</main>
	);
}
