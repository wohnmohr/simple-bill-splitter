import type { Config } from "tailwindcss";

// Aubergine, taken from the logo. The single brand accent.
const brand = {
  50: "#f6f2fa",
  100: "#ece3f5",
  200: "#d8c6ea",
  300: "#bd9fdb",
  400: "#9d73c7",
  500: "#7e4fb0",
  600: "#663a96",
  700: "#53307b",
  800: "#432763",
  900: "#2f1b46",
  950: "#1f1230",
};

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
          DEFAULT: "#1c1826",
          soft: "#4a4556",
          muted: "#6b6576",
        },
        paper: "#f7f6f3",
        line: {
          DEFAULT: "#e7e3ea",
          strong: "#d4cfd9",
        },
        positive: {
          DEFAULT: "#11754c",
          soft: "#e8f4ee",
        },
        negative: {
          DEFAULT: "#b42318",
          soft: "#fcecea",
        },
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
