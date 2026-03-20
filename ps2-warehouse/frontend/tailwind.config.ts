import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:              "#0a0e1a",
        surface:         "#111827",
        panel:           "#1a2234",
        border:          "#1f2d44",
        accent:          "#38bdf8",
        success:         "#22c55e",
        warning:         "#f59e0b",
        muted:           "#4b5e7a",
        "text-primary":  "#e2e8f0",
        "text-secondary":"#8fa3be",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body:    ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow:        "0 0 24px rgba(34, 197, 94, 0.35)",
        "glow-blue": "0 0 20px rgba(56, 189, 248, 0.25)",
        panel:       "0 4px 24px rgba(0,0,0,0.4)",
      },
      keyframes: {
        pulse_ring: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.5)" },
          "50%":      { boxShadow: "0 0 0 14px rgba(34,197,94,0)" },
        },
        count_pop: {
          "0%":   { transform: "scale(1)" },
          "50%":  { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        pulse_ring: "pulse_ring 2s ease-in-out infinite",
        count_pop:  "count_pop 0.25s ease-out",
        fadeInUp:   "fadeInUp 0.4s ease-out both",
        shimmer:    "shimmer 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
