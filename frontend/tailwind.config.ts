import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        surface: "#ffffff",
        card: "#f9fafb",
        border: "#e5e7eb",
      },
      keyframes: {
        // The rotating noun on the open featured slot: the outgoing word leaves
        // upward and the incoming one arrives from below, so the swap reads as one
        // motion rather than a flicker.
        "word-in": {
          "0%": { opacity: "0", transform: "translateY(0.5em)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "word-in": "word-in 340ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
