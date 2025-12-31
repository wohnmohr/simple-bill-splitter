"use client";

import Link from "next/link";
import { Button } from "@/components/UI/Button";

// Ad Component - Replace with actual ad code
const AdPlacement = ({ className = "" }: { className?: string }) => {
	return (
		<div
			className={`bg-gray-100 border border-gray-200 rounded-lg p-4 text-center text-xs text-gray-500 ${className}`}
		>
			<div className="h-24 sm:h-32 flex items-center justify-center">
				<span className="text-gray-400">Advertisement</span>
			</div>
		</div>
	);
};

export const LandingPage = () => {
	return (
		<main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
			{/* Hero Section */}
			<header className="px-4 sm:px-6 py-12 sm:py-20">
				<div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
					<div className="text-5xl sm:text-7xl mb-4">💰</div>
					<h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight pb-2">
						Split Expenses Instantly — No Login, No App
					</h1>
					<p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto">
						Split group expenses online in seconds. Calculate who owes whom
						without signing up, downloading an app, or sharing personal data.
					</p>
					<p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
						Perfect for restaurants, trips, roommates, office lunches, and
						one-time group expenses.
					</p>
					<div className="pt-4">
						<Link href="/dashboard">
							<Button className="text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-5">
								👉 Start splitting bills now
							</Button>
						</Link>
					</div>
				</div>
			</header>

			{/* Subtle Ad Placement 1 - After Hero */}
			<section className="px-4 sm:px-6 pb-8">
				<div className="max-w-4xl mx-auto">
					<AdPlacement />
				</div>
			</section>

			{/* Why Use This Section */}
			<section className="px-4 sm:px-6 py-12 sm:py-16">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">
						Why Use This Expense Splitter?
					</h2>
					<p className="text-lg text-gray-700 mb-8 text-center">
						If you're looking for a Splitwise alternative without login, this is
						exactly that.
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
						<div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="text-2xl mb-2">✔</div>
							<h3 className="text-lg font-bold text-gray-800 mb-2">
								Split bills online instantly
							</h3>
						</div>
						<div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="text-2xl mb-2">✔</div>
							<h3 className="text-lg font-bold text-gray-800 mb-2">
								No account, no app, no signup
							</h3>
						</div>
						<div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="text-2xl mb-2">✔</div>
							<h3 className="text-lg font-bold text-gray-800 mb-2">
								Works entirely in your browser
							</h3>
						</div>
						<div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="text-2xl mb-2">✔</div>
							<h3 className="text-lg font-bold text-gray-800 mb-2">
								Privacy-first — nothing is stored
							</h3>
						</div>
						<div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="text-2xl mb-2">✔</div>
							<h3 className="text-lg font-bold text-gray-800 mb-2">
								Simple "who owes whom" result
							</h3>
						</div>
						<div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="text-2xl mb-2">⚡</div>
							<h3 className="text-lg font-bold text-gray-800 mb-2">
								Lightweight & fast
							</h3>
						</div>
					</div>
					<p className="text-center text-gray-600 mt-8">
						This is a lightweight group expense calculator built for people who
						want fast answers, not another finance app.
					</p>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="px-4 sm:px-6 py-12 sm:py-16 bg-white/40">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">
						How It Works (Simple & Fair)
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
						<div className="text-center">
							<div className="text-4xl mb-3">1️⃣</div>
							<h3 className="font-bold text-gray-800 mb-2">
								Add people involved in the expense
							</h3>
						</div>
						<div className="text-center">
							<div className="text-4xl mb-3">2️⃣</div>
							<h3 className="font-bold text-gray-800 mb-2">
								Enter each expense and who paid
							</h3>
						</div>
						<div className="text-center">
							<div className="text-4xl mb-3">3️⃣</div>
							<h3 className="font-bold text-gray-800 mb-2">
								Select who shared that expense
							</h3>
						</div>
						<div className="text-center">
							<div className="text-4xl mb-3">4️⃣</div>
							<h3 className="font-bold text-gray-800 mb-2">
								Instantly see who owes whom and how much
							</h3>
						</div>
					</div>
					<p className="text-center text-gray-600 mt-8">
						All expenses are split equally, and debts are automatically
						simplified so fewer transactions are needed.
					</p>
				</div>
			</section>

			{/* Use Cases Section */}
			<section className="px-4 sm:px-6 py-12 sm:py-16">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
						Use Cases People Actually Search For
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="text-3xl mb-3">🍽️</div>
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								Split Restaurant Bills
							</h3>
							<p className="text-gray-600">
								Quickly split dinner or lunch bills among friends without
								awkward math at the table.
							</p>
						</article>
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="text-3xl mb-3">🧳</div>
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								Split Trip Expenses
							</h3>
							<p className="text-gray-600">
								Perfect for travel, road trips, vacations, and weekend getaways.
							</p>
						</article>
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="text-3xl mb-3">🏠</div>
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								Roommate Expenses
							</h3>
							<p className="text-gray-600">
								Split shared house bills, groceries, or one-time expenses
								fairly.
							</p>
						</article>
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<div className="text-3xl mb-3">👥</div>
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

			{/* Subtle Ad Placement 2 - Middle of Content */}
			<section className="px-4 sm:px-6 py-8">
				<div className="max-w-4xl mx-auto">
					<AdPlacement />
				</div>
			</section>

			{/* Comparison Table Section */}
			<section className="px-4 sm:px-6 py-12 sm:py-16 bg-white/40">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
						Splitwise Alternative Without Login
					</h2>
					<p className="text-center text-gray-700 mb-8">
						Unlike traditional expense apps:
					</p>
					<div className="overflow-x-auto">
						<table className="w-full bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="text-left p-4 font-bold text-gray-800">
										Feature
									</th>
									<th className="text-center p-4 font-bold text-gray-800">
										This Tool
									</th>
									<th className="text-center p-4 font-bold text-gray-800">
										Other Apps
									</th>
								</tr>
							</thead>
							<tbody>
								<tr className="border-b border-gray-100">
									<td className="p-4 font-semibold text-gray-700">
										Login required
									</td>
									<td className="p-4 text-center text-green-600 font-bold">
										❌ No
									</td>
									<td className="p-4 text-center text-gray-600">✔ Yes</td>
								</tr>
								<tr className="border-b border-gray-100">
									<td className="p-4 font-semibold text-gray-700">
										App download
									</td>
									<td className="p-4 text-center text-green-600 font-bold">
										❌ No
									</td>
									<td className="p-4 text-center text-gray-600">✔ Yes</td>
								</tr>
								<tr className="border-b border-gray-100">
									<td className="p-4 font-semibold text-gray-700">
										Data stored
									</td>
									<td className="p-4 text-center text-green-600 font-bold">
										❌ No
									</td>
									<td className="p-4 text-center text-gray-600">✔ Yes</td>
								</tr>
								<tr className="border-b border-gray-100">
									<td className="p-4 font-semibold text-gray-700">
										One-time use
									</td>
									<td className="p-4 text-center text-green-600 font-bold">
										✔ Yes
									</td>
									<td className="p-4 text-center text-gray-600">❌ No</td>
								</tr>
								<tr>
									<td className="p-4 font-semibold text-gray-700">
										Instant results
									</td>
									<td className="p-4 text-center text-green-600 font-bold">
										✔ Yes
									</td>
									<td className="p-4 text-center text-gray-600">Often slow</td>
								</tr>
							</tbody>
						</table>
					</div>
					<p className="text-center text-gray-600 mt-6">
						This tool is designed for one-time expense splitting, not long-term
						tracking.
					</p>
				</div>
			</section>

			{/* Privacy Section */}
			<section className="px-4 sm:px-6 py-12 sm:py-16">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">
						Privacy-First Expense Splitting
					</h2>
					<div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-8">
						<div className="text-4xl mb-4 text-center">🔒</div>
						<p className="text-xl font-bold text-gray-800 mb-6 text-center">
							Your data never leaves your device.
						</p>
						<ul className="space-y-4 text-gray-700">
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
						<p className="text-center text-gray-600 mt-6">
							Ideal if you want a private, anonymous expense splitter.
						</p>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="px-4 sm:px-6 py-12 sm:py-16 bg-white/40">
				<div className="max-w-4xl mx-auto">
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
						Frequently Asked Questions
					</h2>
					<div className="space-y-6">
						<article className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
							<h3 className="text-xl font-bold text-gray-800 mb-2">
								How do I split expenses among friends?
							</h3>
							<p className="text-gray-600">
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
			<section className="px-4 sm:px-6 py-12 sm:py-16">
				<div className="max-w-4xl mx-auto text-center space-y-6">
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
						Start Splitting Bills Now
					</h2>
					<p className="text-lg text-gray-700">
						Stop wasting time downloading apps or creating accounts. Split
						expenses instantly and move on.
					</p>
					<div className="pt-4">
						<Link href="/dashboard">
							<Button className="text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-5">
								👉 Use the free expense splitter
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Subtle Ad Placement 3 - Before Footer */}
			<section className="px-4 sm:px-6 py-8">
				<div className="max-w-4xl mx-auto">
					<AdPlacement />
				</div>
			</section>
		</main>
	);
};
