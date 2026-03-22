import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          DEFAULT: "#C4B5E0",
          light: "#EDE8F5",
          ultra: "#F6F3FB",
        },
        "misty-blue": {
          DEFAULT: "#A8C4D8",
          light: "#D6E6F0",
        },
        "pale-rose": {
          DEFAULT: "#E8C4C8",
          light: "#F5E4E7",
        },
        chrysalis: {
          bg: "#FDFCFE",
          card: "#FFFFFF",
          border: "rgba(180, 168, 200, 0.2)",
          text: {
            primary: "#2A2438",
            secondary: "#6B6280",
            tertiary: "#9990A8",
          },
        },
      },
      fontFamily: {
        // Cormorant Garamond for Latin, Noto Serif SC as CJK fallback.
        // The browser uses each font only for the characters it covers,
        // so Chinese falls through to Noto Serif SC automatically.
        display: ["var(--font-display)", "var(--font-display-cjk)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
        chip: "14px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 16px 40px rgba(42, 36, 56, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

