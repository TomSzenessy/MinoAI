import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mino: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          purple: "var(--purple-400)",
          glow: "var(--purple-600)",
        },
      },
      borderRadius: {
        "mino-lg": "var(--radius-lg)",
        "mino-xl": "var(--radius-xl)",
        "mino-2xl": "var(--radius-2xl)",
      },
      boxShadow: {
        "mino-sm": "var(--glow-sm)",
        "mino-md": "var(--glow-md)",
        "mino-lg": "var(--glow-lg)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
