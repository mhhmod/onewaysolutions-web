import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        surface: "oklch(var(--surface) / <alpha-value>)",
        muted: "oklch(var(--muted) / <alpha-value>)",
        border: "oklch(var(--border) / <alpha-value>)",
        primary: "oklch(var(--primary) / <alpha-value>)",
        accent: "oklch(var(--accent) / <alpha-value>)",
        steel: "oklch(var(--steel) / <alpha-value>)",
        success: "oklch(var(--success) / <alpha-value>)",
        warning: "oklch(var(--warning) / <alpha-value>)",
        danger: "oklch(var(--danger) / <alpha-value>)"
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      },
      boxShadow: {
        industrial: "0 22px 60px oklch(0.22 0.03 250 / 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
