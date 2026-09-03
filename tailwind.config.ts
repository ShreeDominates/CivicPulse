import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0F2240",
          50: "#E8ECF2",
          100: "#C5CDD9",
          200: "#9BABB8",
          300: "#718997",
          400: "#4D6B7D",
          500: "#2A4D63",
          600: "#1C3A52",
          700: "#0F2240",
          800: "#0A1830",
          900: "#050C18",
        },
        accent: {
          DEFAULT: "#1C5AA0",
          light: "#2A6FC0",
          dark: "#144480",
        },
        saffron: {
          DEFAULT: "#EB7820",
          light: "#F09040",
          dark: "#C96618",
        },
        success: {
          DEFAULT: "#22964A",
          light: "#2AAF5A",
          dark: "#1A7A3C",
        },
        error: {
          DEFAULT: "#DC2626",
          light: "#EF4444",
          dark: "#B91C1C",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#F59E0B",
          dark: "#B45309",
        },
        background: "#F6F8FC",
        card: "#FFFFFF",
        "card-border": "#DCE2EB",
        "text-primary": "#181E2A",
        "text-muted": "#5A6473",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans", "system-ui", "sans-serif"],
        indic: ["Noto Sans", "Inter", "sans-serif"],
      },
      animation: {
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.5)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
