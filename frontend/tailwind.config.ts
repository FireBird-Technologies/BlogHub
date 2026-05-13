import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        surface: "#ffffff",
        card: "#f9fafb",
        border: "#e5e7eb",
      },
    },
  },
  plugins: [],
} satisfies Config;
