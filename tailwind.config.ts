import type { Config } from "tailwindcss";

// Every color is a CSS variable holding "R G B", so a group theme can swap the
// palette at runtime (utils/themes.ts) and opacity modifiers like bg-ink/5 still
// work. The defaults in app/globals.css are the SplitBiller aubergine.
const token = (name: string) => `rgb(var(--sb-${name}) / <alpha-value>)`;
const brand = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, token(`brand-${n}`)])
);

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand,
        // Legacy utilities in the tool calculators resolve to the brand hue,
        // so every surface speaks one accent.
        indigo: brand,
        violet: brand,
        purple: brand,
        ink: {
          DEFAULT: token("ink"),
          soft: token("ink-soft"),
          muted: token("ink-muted"),
        },
        paper: token("paper"),
        // Cards, inputs and sheets (white in light themes).
        surface: token("surface"),
        line: {
          DEFAULT: token("line"),
          strong: token("line-strong"),
        },
        positive: {
          DEFAULT: token("positive"),
          soft: token("positive-soft"),
        },
        negative: {
          DEFAULT: token("negative"),
          soft: token("negative-soft"),
        },
        // Text on a brand-colored or ink-colored background.
        "on-brand": token("on-brand"),
        "on-ink": token("on-ink"),
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "var(--font-fraunces)",
          "var(--font-outfit)",
          "ui-serif",
          "Georgia",
          "serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 24, 38, 0.04), 0 1px 1px rgba(28, 24, 38, 0.03)",
        raised:
          "0 1px 2px rgba(28, 24, 38, 0.06), 0 8px 24px -8px rgba(47, 27, 70, 0.22)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
