import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4fb", 100: "#d9e6f5", 200: "#b6cdea", 300: "#8aaed9", 400: "#5b8ac4",
          500: "#376eae", 600: "#255a96", 700: "#1d4a7c", 800: "#183d65", 900: "#14314f",
        },
      },
      fontFamily: { sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
