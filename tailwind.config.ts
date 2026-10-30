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
        // Pending or "check this" states; never the only signal (always with text).
        warning: {
          DEFAULT: token("warning"),
          soft: token("warning-soft"),
        },
        // Text on a brand-colored or ink-colored background.
        "on-brand": token("on-brand"),
        "on-ink": token("on-ink"),
      },
      // The design system uses the platform's own sans: no font downloads.
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(40, 35, 38, 0.04)",
        raised:
          "0 1px 2px rgba(40, 35, 38, 0.06), 0 8px 24px -8px rgba(46, 23, 38, 0.22)",
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
