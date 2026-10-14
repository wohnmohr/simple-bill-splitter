import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, HelpCircle, Lightbulb, Mail, Users } from "lucide-react";
import { SiteNav } from "@/components/Landing/SiteNav";
import { SiteFooter } from "@/components/Landing/SiteFooter";
import { ContactForm } from "@/components/Contact/ContactForm";
import { BOOKING_URL, CONTACT_EMAIL } from "@/content/contact";

export const metadata: Metadata = {
	title: "Contact SplitBiller",
	description:
		"Questions, problems, privacy requests or partnerships: email the SplitBiller team, send a message or book a 15-minute call.",
	alternates: { canonical: "/contact" },
};

const ELSEWHERE = [
	{ href: "/#faq", icon: HelpCircle, title: "Quick answers", body: "Common questions about splitting, UPI and privacy." },
	{ href: "/feature-requests", icon: Lightbulb, title: "Request a feature", body: "Tell us what SplitBiller should do next." },
	{ href: "/about", icon: Users, title: "About SplitBiller", body: "Who makes it and how it handles your money and data." },
];

export default function ContactPage() {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink">
			<SiteNav />

			<div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
				<div className="min-w-0">
					<p className="label-text">Contact</p>
					<h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.25rem)] font-semibold leading-[1.05]">Talk to us</h1>
					<p className="mt-4 max-w-xl text-lg text-ink-soft">
						Questions, something not working, a privacy request or a partnership: send a message here and we&apos;ll
						reply by email, or reach us directly.
					</p>
					<div className="mt-8">
						<ContactForm />
					</div>
				</div>

				<aside aria-label="Other ways to reach us" className="space-y-6 lg:pt-24">
					<div className="surface divide-y divide-line overflow-hidden">
						<a href={`mailto:${CONTACT_EMAIL}`} className="flex items-start gap-3 p-4 hover:bg-paper">
							<Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" strokeWidth={1.75} />
							<span className="min-w-0">
								<span className="block font-semibold text-ink">Email us</span>
								<span className="mt-0.5 block break-all text-sm text-brand-700 underline">{CONTACT_EMAIL}</span>
							</span>
						</a>
						<a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-4 hover:bg-paper">
							<CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" strokeWidth={1.75} />
							<span className="min-w-0">
								<span className="block font-semibold text-ink">Book a 15-minute call</span>
								<span className="mt-0.5 block text-sm text-ink-muted">Pick a time that suits you, on cal.com.</span>
							</span>
						</a>
					</div>
					<ul className="space-y-3">
						{ELSEWHERE.map(({ href, icon: Icon, title, body }) => (
							<li key={href}>
								<Link
									href={href}
									className="group flex items-start gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand-300"
								>
									<Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" strokeWidth={1.75} />
									<span className="min-w-0">
										<span className="flex items-center gap-1 font-semibold text-ink">
											{title}
											<ArrowRight className="h-4 w-4 -translate-x-1 text-ink-muted opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
										</span>
										<span className="mt-0.5 block text-sm text-ink-muted">{body}</span>
									</span>
								</Link>
							</li>
						))}
					</ul>
				</aside>
			</div>

			<SiteFooter />
		</main>
	);
}
