import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        surface: "#ffffff",
        card: "#f7f8fa",
        border: "#e3e5ea",
        // Cool, slightly blue neutrals. Every `gray-*` utility in the app resolves
        // here, so the whole UI shifts from warm paper-gray to a crisp graphite.
        gray: {
          50: "#f7f8fa",
          100: "#eff0f3",
          200: "#e3e5ea",
          300: "#cdd0d8",
          400: "#9a9fac",
          500: "#6c7180",
          600: "#4d5261",
          700: "#363a47",
          800: "#1f222c",
          900: "#12141b",
          950: "#090a0f",
        },
        // Brand red, pushed a touch deeper and cleaner so it reads as lacquer
        // rather than poster paint against the cool neutrals.
        red: {
          50: "#fff1f2",
          100: "#ffe1e3",
          200: "#ffc7cb",
          300: "#ff9fa6",
          400: "#fb6470",
          500: "#f03345",
          600: "#dc1f33",
          700: "#b91527",
          800: "#991524",
          900: "#7f1823",
          950: "#45070e",
        },
      },
      borderRadius: {
        md: "0.5rem",
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      // Layered, low-opacity shadows: a tight contact shadow plus a wide ambient
      // one. This is what makes surfaces look lifted and glossy without gradients.
      boxShadow: {
        sm: "0 1px 2px rgba(18, 20, 27, 0.05)",
        DEFAULT: "0 1px 2px rgba(18, 20, 27, 0.06), 0 2px 6px -1px rgba(18, 20, 27, 0.05)",
        md: "0 1px 2px rgba(18, 20, 27, 0.05), 0 6px 16px -4px rgba(18, 20, 27, 0.08)",
        lg: "0 2px 4px rgba(18, 20, 27, 0.04), 0 14px 32px -8px rgba(18, 20, 27, 0.12)",
        xl: "0 4px 8px rgba(18, 20, 27, 0.04), 0 24px 48px -12px rgba(18, 20, 27, 0.16)",
        "2xl": "0 8px 16px rgba(18, 20, 27, 0.05), 0 40px 80px -20px rgba(18, 20, 27, 0.24)",
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
