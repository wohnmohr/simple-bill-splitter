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
} from "lucide-react";

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
					<h1 className="text-[clamp(1.25rem,6vw,3.25rem)] font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight whitespace-nowrap">
						Split Expenses Instantly
					</h1>
					<p className="text-base sm:text-lg !text-gray-700 max-w-2xl mx-auto">
						Calculate who owes whom in seconds — no sign-up, no app, no data
						stored. Perfect for restaurants, trips, roommates, and office
						lunches.
					</p>
					<div className="pt-2">
						<Link href="/dashboard">
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

			{/* Use Cases Section */}
			<section className="px-4 sm:px-6 py-8 sm:py-12">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-2xl sm:text-3xl font-bold !text-gray-900 mb-6 text-center">
						Use Cases People Actually Search For
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="mb-3">
								<UtensilsCrossed className="h-8 w-8 text-indigo-600" />
							</div>
							<h3 className="text-xl font-bold !text-gray-800 mb-2">
								Split Restaurant Bills
							</h3>
							<p className="!text-gray-600">
								Quickly split dinner or lunch bills among friends without
								awkward math at the table.
							</p>
						</article>
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="mb-3">
								<Luggage className="h-8 w-8 text-indigo-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								Split Trip Expenses
							</h3>
							<p className="text-gray-600">
								Perfect for travel, road trips, vacations, and weekend getaways.
							</p>
						</article>
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="mb-3">
								<Home className="h-8 w-8 text-indigo-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								Roommate Expenses
							</h3>
							<p className="text-gray-600">
								Split shared house bills, groceries, or one-time expenses
								fairly.
							</p>
						</article>
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="mb-3">
								<Users className="h-8 w-8 text-indigo-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								Office & Team Outings
							</h3>
							<p className="text-gray-600">
								Settle group lunch or team outing expenses in seconds.
							</p>
						</article>
					</div>
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
						<Link href="/dashboard">
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
			<footer className="px-4 sm:px-6 py-6 border-t border-gray-200">
				<div className="max-w-4xl mx-auto text-center space-y-3">
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
			</footer>
		</main>
	);
};
