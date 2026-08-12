"use client";

import Link from "next/link";
import { Button } from "@/components/UI/Button";
import {
	Receipt,
	UserX,
	Globe,
	Lock,
	ArrowRightLeft,
	Zap,
	ArrowRight,
	Users,
	UtensilsCrossed,
	Luggage,
	Home,
	UsersRound,
	Check,
	X,
	Percent,
	Scale,
	IndianRupee,
	UserMinus,
} from "lucide-react";
import { track } from "@/lib/analytics";
import { ALL_TOOL_SLUGS, TOOL_PAGES, ToolSlug } from "@/content/tools";

const TOOL_ICONS: Record<ToolSlug, typeof Receipt> = {
	"restaurant-bill-splitter": UtensilsCrossed,
	"trip-expense-splitter": Luggage,
	"roommate-expense-splitter": Home,
	"upi-bill-splitter": IndianRupee,
	"split-bill-with-tip": Percent,
	"split-bill-with-tax": Receipt,
	"split-bill-unequally": Scale,
	"split-bill-without-signup": UserMinus,
	"splitwise-alternative": ArrowRightLeft,
};

const TOOL_BLURBS: Record<ToolSlug, string> = {
	"restaurant-bill-splitter":
		"Dinner bill + tip or service charge, split among friends.",
	"trip-expense-splitter": "Hotels, rides, meals — settle the whole trip.",
	"roommate-expense-splitter": "Rent, utilities, and groceries without the spreadsheet.",
	"upi-bill-splitter": "Split in ₹ and open UPI pay links for each settlement.",
	"split-bill-with-tip": "Add a tip %, then divide fairly.",
	"split-bill-with-tax": "Include GST/sales tax in each person’s share.",
	"split-bill-unequally": "Custom amounts or percentages when orders differ.",
	"split-bill-without-signup": "Instant split — no account, no app download.",
	"splitwise-alternative": "Who owes whom, without forcing friends onto an app.",
};

export const LandingPage = () => {
	return (
		<main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-900">
			{/* Product Hunt Banner */}
			<a
				href="https://www.producthunt.com/products/split-biller?utm_source=banner&utm_medium=embed"
				target="_blank"
				rel="noopener noreferrer"
				className="block bg-[#ff6154] text-white text-center text-sm sm:text-base font-semibold px-4 py-2.5 hover:bg-[#e0533f] transition-colors"
			>
				<span className="inline-flex items-center gap-2 flex-wrap justify-center">
					<img
						src="https://ph-files.imgix.net/e82f50fe-9e12-48be-b029-948fa71563cd.png?auto=compress,format&codec=mozjpeg&cs=strip&fit=crop&h=32&w=32"
						alt="split biller on Product Hunt"
						className="w-5 h-5 rounded"
					/>
					We&apos;re live on Product Hunt — support us with an upvote!
					<ArrowRight className="h-4 w-4 !text-white" />
				</span>
			</a>

			{/* Site nav */}
			<nav className="sticky top-0 z-40 border-b border-indigo-100/80 bg-white/80 backdrop-blur-md">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
					<Link href="/" className="flex items-center gap-2 shrink-0">
						<img
							src="/logo.png"
							alt="SplitBiller"
							className="w-8 h-8 object-contain"
						/>
						<span className="font-bold text-base bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
							SplitBiller
						</span>
					</Link>
					<div className="flex items-center gap-2 sm:gap-3">
						<a
							href="#tools"
							className="text-sm font-medium text-gray-700 hover:text-indigo-700 px-2 py-1.5"
						>
							Tools
						</a>
						<Link href="/dashboard">
							<Button variant="primary" size="sm">
								Open app
							</Button>
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<header className="px-4 sm:px-6 pt-8 pb-10 sm:pt-10 sm:pb-14">
				<div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-5">
					<div className="flex justify-center">
						<img
							src="/logo.png"
							alt="SplitBiller Logo"
							className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
						/>
					</div>
					<h1 className="text-[clamp(1.35rem,5.5vw,3rem)] font-display font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-tight">
						Split bills in ₹, settle with UPI
					</h1>
					<p className="text-base sm:text-lg !text-gray-700 max-w-2xl mx-auto">
						Who owes whom in seconds — share privately, pay via UPI. No signup,
						no app download.
					</p>
					<div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
						<Link
							href="/dashboard"
							onClick={() =>
								track("landing_cta_clicked", { location: "hero" })
							}
						>
							<Button
								variant="primary"
								size="xl"
								className="!px-8 !py-4 !text-lg !font-semibold"
							>
								<span className="flex items-center gap-3">
									Start splitting bills now
									<ArrowRight className="h-6 w-6 !text-white" />
								</span>
							</Button>
						</Link>
						<a
							href="#tools"
							className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
						>
							Browse quick calculators ↓
						</a>
					</div>
					<div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-sm !text-gray-600">
						<span className="inline-flex items-center gap-1.5">
							<Check className="h-4 w-4 text-indigo-600" />
							Free forever
						</span>
						<span className="inline-flex items-center gap-1.5">
							<Check className="h-4 w-4 text-indigo-600" />
							No sign-up
						</span>
						<span className="inline-flex items-center gap-1.5">
							<Check className="h-4 w-4 text-indigo-600" />
							Works on any device
						</span>
					</div>
					<div className="flex justify-center pt-2">
						<a
							href="https://www.producthunt.com/products/split-biller?utm_source=hero&utm_medium=embed"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#ff6154]/30 text-sm font-semibold !text-[#ff6154] shadow-sm hover:bg-white transition-colors"
						>
							<img
								src="https://ph-files.imgix.net/e82f50fe-9e12-48be-b029-948fa71563cd.png?auto=compress,format&codec=mozjpeg&cs=strip&fit=crop&h=32&w=32"
								alt="split biller on Product Hunt"
								className="w-5 h-5 rounded"
							/>
							Featured on Product Hunt
						</a>
					</div>
				</div>
			</header>

			{/* Quick tools — primary navigation to SEO pages */}
			<section id="tools" className="px-4 sm:px-6 py-10 sm:py-14 scroll-mt-16">
				<div className="max-w-5xl mx-auto">
					<div className="text-center mb-8 space-y-2">
						<h2 className="text-2xl sm:text-3xl font-bold !text-gray-900">
							Quick calculators
						</h2>
						<p className="text-base !text-gray-600 max-w-2xl mx-auto">
							Jump into a tool for your exact situation — then share the
							settlement with friends.
						</p>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
						{ALL_TOOL_SLUGS.map((slug) => {
							const config = TOOL_PAGES[slug];
							const Icon = TOOL_ICONS[slug];
							return (
								<Link
									key={slug}
									href={`/${slug}`}
									onClick={() =>
										track("landing_cta_clicked", {
											location: "tools_grid",
											tool: slug,
										})
									}
									className="group flex flex-col gap-3 bg-white/90 backdrop-blur-sm rounded-2xl border border-indigo-100/80 p-5 shadow-md hover:border-indigo-300 hover:shadow-lg transition-all"
								>
									<div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
										<Icon className="h-5 w-5 text-indigo-600" />
									</div>
									<div>
										<h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
											{config.title}
										</h3>
										<p className="text-sm text-gray-600 mt-1 leading-snug">
											{TOOL_BLURBS[slug]}
										</p>
									</div>
									<span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
										Open tool
										<ArrowRight className="h-4 w-4" />
									</span>
								</Link>
							);
						})}
					</div>
				</div>
			</section>

			{/* Demo Section */}
			<section className="px-4 sm:px-6 pb-8 sm:pb-12">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl sm:text-3xl font-bold !text-gray-900 mb-6 text-center">
						See it in action
					</h2>
					<div className="rounded-2xl overflow-hidden shadow-xl border border-white/50 bg-white">
						<div
							style={{
								position: "relative",
								paddingBottom: "calc(52.9688% + 41px)",
								height: 0,
								width: "100%",
							}}
						>
							<iframe
								src="https://demo.arcade.software/ziv5LbSvTljkl6cuICDu?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true"
								title="Create and Manage Group Trip Expenses"
								frameBorder="0"
								loading="lazy"
								allowFullScreen
								allow="clipboard-write"
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									colorScheme: "light",
								}}
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Why Use This Section */}
			<section className="px-4 sm:px-6 py-8 sm:py-12">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl sm:text-3xl font-bold !text-gray-900 mb-2 text-center">
						Why Use This Expense Splitter?
					</h2>
					<p className="text-base !text-gray-600 mb-6 text-center">
						A Splitwise alternative without the login.
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
						{[
							{ icon: Receipt, label: "Split bills online instantly" },
							{ icon: UserX, label: "No account, no app, no signup" },
							{ icon: Globe, label: "Works entirely in your browser" },
							{ icon: Lock, label: "Privacy-first — nothing is stored" },
							{ icon: ArrowRightLeft, label: 'Simple "who owes whom" result' },
							{ icon: Zap, label: "Lightweight & fast" },
						].map(({ icon: Icon, label }) => (
							<div
								key={label}
								className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/50 p-4"
							>
								<div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
									<Icon className="h-5 w-5 text-indigo-600" />
								</div>
								<h3 className="text-sm sm:text-base font-semibold !text-gray-800">
									{label}
								</h3>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="px-4 sm:px-6 py-8 sm:py-12 bg-white/40">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl sm:text-3xl font-bold !text-gray-900 mb-6 text-center">
						How It Works (Simple & Fair)
					</h2>
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
						<div className="text-center">
							<div className="mb-3 flex justify-center">
								<div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
									<Users className="h-6 w-6 text-indigo-600" />
								</div>
							</div>
							<h3 className="font-bold !text-gray-800 mb-2">
								Add people involved in the expense
							</h3>
						</div>
						<div className="text-center">
							<div className="mb-3 flex justify-center">
								<div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
									<Receipt className="h-6 w-6 text-indigo-600" />
								</div>
							</div>
							<h3 className="font-bold text-gray-800 mb-2">
								Enter each expense and who paid
							</h3>
						</div>
						<div className="text-center">
							<div className="mb-3 flex justify-center">
								<div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
									<UsersRound className="h-6 w-6 text-indigo-600" />
								</div>
							</div>
							<h3 className="font-bold text-gray-800 mb-2">
								Select who shared that expense
							</h3>
						</div>
						<div className="text-center">
							<div className="mb-3 flex justify-center">
								<div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
									<ArrowRightLeft className="h-6 w-6 text-indigo-600" />
								</div>
							</div>
							<h3 className="font-bold text-gray-800 mb-2">
								Instantly see who owes whom and how much
							</h3>
						</div>
					</div>
					<p className="text-center !text-gray-600 mt-6">
						All expenses are split equally, and debts are automatically
						simplified so fewer transactions are needed.
					</p>
				</div>
			</section>

			{/* Comparison Table Section */}
			<section className="px-4 sm:px-6 py-8 sm:py-12 bg-white/40">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl sm:text-3xl font-bold !text-gray-900 mb-2 text-center">
						Splitwise Alternative Without Login
					</h2>
					<p className="text-center !text-gray-600 mb-6">
						Unlike traditional expense apps:
					</p>
					<div className="overflow-x-auto">
						<table className="w-full bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="text-left p-4 font-bold !text-gray-800">
										Feature
									</th>
									<th className="text-center p-4 font-bold !text-gray-800">
										This Tool
									</th>
									<th className="text-center p-4 font-bold !text-gray-800">
										Other Apps
									</th>
								</tr>
							</thead>
							<tbody>
								<tr className="border-b border-gray-100">
									<td className="p-4 font-semibold !text-gray-700">
										Login required
									</td>
									<td className="p-4 text-center">
										<div className="text-green-600 font-bold inline-flex items-center justify-center gap-1">
											<X className="h-5 w-5" />
											No
										</div>
									</td>
									<td className="p-4 text-center">
										<div className="text-gray-600 inline-flex items-center justify-center gap-1">
											<Check className="h-5 w-5" />
											Yes
										</div>
									</td>
								</tr>
								<tr className="border-b border-gray-100">
									<td className="p-4 font-semibold text-gray-700">
										App download
									</td>
									<td className="p-4 text-center">
										<div className="text-green-600 font-bold inline-flex items-center justify-center gap-1">
											<X className="h-5 w-5" />
											No
										</div>
									</td>
									<td className="p-4 text-center">
										<div className="text-gray-600 inline-flex items-center justify-center gap-1">
											<Check className="h-5 w-5" />
											Yes
										</div>
									</td>
								</tr>
								<tr className="border-b border-gray-100">
									<td className="p-4 font-semibold text-gray-700">
										Data stored
									</td>
									<td className="p-4 text-center">
										<div className="text-green-600 font-bold inline-flex items-center justify-center gap-1">
											<X className="h-5 w-5" />
											No
										</div>
									</td>
									<td className="p-4 text-center">
										<div className="text-gray-600 inline-flex items-center justify-center gap-1">
											<Check className="h-5 w-5" />
											Yes
										</div>
									</td>
								</tr>
								<tr className="border-b border-gray-100">
									<td className="p-4 font-semibold text-gray-700">
										One-time use
									</td>
									<td className="p-4 text-center">
										<div className="text-green-600 font-bold inline-flex items-center justify-center gap-1">
											<Check className="h-5 w-5" />
											Yes
										</div>
									</td>
									<td className="p-4 text-center">
										<div className="text-gray-600 inline-flex items-center justify-center gap-1">
											<X className="h-5 w-5" />
											No
										</div>
									</td>
								</tr>
								<tr>
									<td className="p-4 font-semibold text-gray-700">
										Instant results
									</td>
									<td className="p-4 text-center">
										<div className="text-green-600 font-bold inline-flex items-center justify-center gap-1">
											<Check className="h-5 w-5" />
											Yes
										</div>
									</td>
									<td className="p-4 text-center !text-gray-600">Often slow</td>
								</tr>
							</tbody>
						</table>
					</div>
					<p className="text-center !text-gray-600 mt-6">
						This tool is designed for one-time expense splitting, not long-term
						tracking.
					</p>
				</div>
			</section>

			{/* Privacy Section */}
			<section className="px-4 sm:px-6 py-8 sm:py-12">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl sm:text-3xl font-bold !text-gray-900 mb-6 text-center">
						Privacy-First Expense Splitting
					</h2>
					<div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
						<div className="mb-3 flex justify-center">
							<Lock className="h-10 w-10 text-indigo-600" />
						</div>
						<p className="text-lg sm:text-xl font-bold !text-gray-800 mb-4 text-center">
							Your data never leaves your device.
						</p>
						<ul className="space-y-2.5 !text-gray-700 max-w-md mx-auto">
							<li className="flex items-start">
								<span className="mr-3">•</span>
								<span>All calculations run locally in your browser</span>
							</li>
							<li className="flex items-start">
								<span className="mr-3">•</span>
								<span>No servers, no databases, no tracking</span>
							</li>
							<li className="flex items-start">
								<span className="mr-3">•</span>
								<span>Refresh the page and everything resets</span>
							</li>
						</ul>
						<p className="text-center !text-gray-600 mt-6">
							Ideal if you want a private, anonymous expense splitter.
						</p>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="px-4 sm:px-6 py-8 sm:py-12 bg-white/40">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl sm:text-3xl font-bold !text-gray-900 mb-6 text-center">
						Frequently Asked Questions
					</h2>
					<div className="space-y-3">
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<h3 className="text-xl font-bold !text-gray-800 mb-2">
								How do I split expenses among friends?
							</h3>
							<p className="!text-gray-600">
								Add everyone involved, enter who paid, select participants, and
								the calculator shows who owes whom.
							</p>
						</article>
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								Can I split expenses without creating an account?
							</h3>
							<p className="text-gray-600">
								Yes. This tool works without login or signup.
							</p>
						</article>
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								Is this better than Splitwise?
							</h3>
							<p className="text-gray-600">
								If you need long-term tracking, use Splitwise. If you want
								instant bill splitting without login, this is faster and
								simpler.
							</p>
						</article>
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								Can I use this on mobile?
							</h3>
							<p className="text-gray-600">
								Yes. It's fully mobile-friendly and works in any browser.
							</p>
						</article>
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								Does it support different currencies?
							</h3>
							<p className="text-gray-600">
								Yes. The calculator works with any currency.
							</p>
						</article>
					</div>
				</div>
			</section>

			{/* Final CTA Section */}
			<section className="px-4 sm:px-6 py-10 sm:py-14">
				<div className="max-w-4xl mx-auto text-center space-y-4">
					<h2 className="text-2xl sm:text-3xl font-bold !text-gray-900">
						Start Splitting Bills Now
					</h2>
					<p className="text-base sm:text-lg !text-gray-700 max-w-xl mx-auto">
						No downloads, no accounts — split expenses instantly and move on.
					</p>
					<div className="pt-2">
						<Link
							href="/dashboard"
							onClick={() =>
								track("landing_cta_clicked", { location: "footer" })
							}
						>
							<Button
								variant="primary"
								size="xl"
								className="!px-8 !py-4 !text-lg !font-semibold"
							>
								<span className="flex items-center gap-3">
									Use the free expense splitter
									<ArrowRight className="h-6 w-6 !text-white" />
								</span>
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="px-4 sm:px-6 py-8 border-t border-gray-200">
				<div className="max-w-5xl mx-auto space-y-6">
					<div>
						<p className="text-sm font-semibold text-gray-800 mb-3 text-center">
							All tools
						</p>
						<ul className="flex flex-wrap justify-center gap-2">
							{ALL_TOOL_SLUGS.map((slug) => (
								<li key={slug}>
									<Link
										href={`/${slug}`}
										className="inline-block rounded-lg bg-white/80 border border-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
									>
										{TOOL_PAGES[slug].title}
									</Link>
								</li>
							))}
						</ul>
					</div>
					<div className="text-center space-y-3">
						<div className="flex justify-center">
							<a
								href="https://www.producthunt.com/products/split-biller?utm_source=badge&utm_medium=embed"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff6154] text-white text-sm font-semibold shadow-sm hover:bg-[#e0533f] transition-colors"
							>
								<img
									src="https://ph-files.imgix.net/e82f50fe-9e12-48be-b029-948fa71563cd.png?auto=compress,format&codec=mozjpeg&cs=strip&fit=crop&h=32&w=32"
									alt="split biller on Product Hunt"
									className="w-5 h-5 rounded"
								/>
								Find us on Product Hunt
								<ArrowRight className="h-4 w-4 !text-white" />
							</a>
						</div>
						<p className="text-sm !text-gray-600">
							© {new Date().getFullYear()} splitbiller.com. All rights reserved.
						</p>
						<p className="text-sm !text-gray-600">
							Created by{" "}
							<a
								href="https://www.wohnmohr.com"
								target="_blank"
								rel="noopener noreferrer"
								className="!text-indigo-600 hover:!text-indigo-800 font-medium underline"
							>
								wohnmohr
							</a>
						</p>
					</div>
				</div>
			</footer>
		</main>
	);
};
