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
          "purple-50": "var(--purple-50)",
          "purple-100": "var(--purple-100)",
          "purple-200": "var(--purple-200)",
          "purple-300": "var(--purple-300)",
          "purple-400": "var(--purple-400)",
          "purple-500": "var(--purple-500)",
          "purple-600": "var(--purple-600)",
          "purple-700": "var(--purple-700)",
          "purple-800": "var(--purple-800)",
          "purple-900": "var(--purple-900)",
          "purple-950": "var(--purple-950)",
        },
      },
      borderRadius: {
        "mino-sm": "var(--radius-sm)",
        "mino-md": "var(--radius-md)",
        "mino-lg": "var(--radius-lg)",
        "mino-xl": "var(--radius-xl)",
        "mino-2xl": "var(--radius-2xl)",
        "mino-full": "var(--radius-full)",
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
      animation: {
        "fade-up": "fadeUp 0.6s var(--ease) both",
        "pulse-slow": "pulse 2s ease-in-out infinite",
        "bounce-slow": "bounce 2s ease-in-out infinite",
        "slide-down": "slideDown 0.6s var(--ease) both",
      },
      transitionTimingFunction: {
        ease: "var(--ease)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        DEFAULT: "var(--duration)",
        slow: "var(--duration-slow)",
      },
    },
  },
  plugins: [],
};

export default config;
