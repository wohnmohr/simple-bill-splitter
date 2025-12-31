# SplitBiller

A modern, user-friendly web application for splitting bills and expenses among groups of people. Built with Next.js, React, and TypeScript.

## Features

- **Group Management**: Create and manage multiple expense groups (up to 3 groups)
- **Member Management**: Add and remove members from groups
- **Expense Tracking**: Add expenses with descriptions, amounts, and participants
- **Balance Calculation**: Automatically calculates who owes what to whom
- **Settlement Suggestions**: Provides optimal settlement recommendations to minimize transactions
- **Multi-Currency Support**: Supports USD, EUR, GBP, JPY, and INR
- **Local Storage**: All data is persisted in browser's local storage
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Beautiful gradient design with smooth interactions

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Storage**: Browser Local Storage

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd splitbiller
```

1. Install dependencies:

```bash
pnpm install
```

1. Run the development server:

```bash
pnpm dev
```

1. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

## How It Works

1. **Create a Group**: Start by creating a new group and selecting a currency
2. **Add Members**: Add people to your group who will be splitting expenses
3. **Add Expenses**: Record expenses with:
   - Amount
   - Who paid
   - Who participated (can select multiple people)
   - Optional description
4. **View Balances**: See how much each person owes or is owed
5. **Settle Up**: View optimized settlement suggestions showing who should pay whom

## Project Structure

```
splitbiller/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page component
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Balances/         # Balance display components
│   ├── EmptyStates/      # Empty state components
│   ├── Expense/          # Expense-related components
│   ├── Group/            # Group management components
│   ├── Header/           # Header component
│   ├── Settlements/      # Settlement display components
│   ├── Tabs/             # Tab navigation
│   └── UI/               # Reusable UI components
├── constants/            # App constants (currencies, limits)
├── hooks/                # Custom React hooks
│   ├── useExpenses.ts
│   ├── useGroups.ts
│   └── useGroupMembers.ts
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
│   ├── calculations.ts   # Balance and settlement calculations
│   ├── formatting.ts     # Formatting utilities
│   └── storage.ts        # Local storage utilities
└── package.json
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Key Features Explained

### Balance Calculation

The app calculates balances by:

- Crediting the person who paid the full amount
- Debiting each participant their share (amount ÷ number of participants)

### Settlement Algorithm

The settlement feature uses a greedy algorithm to minimize the number of transactions needed:

- Matches the largest creditor with the largest debtor
- Continues until all debts are settled
- Provides the most efficient payment path

## License

This project is private and not licensed for public use.
