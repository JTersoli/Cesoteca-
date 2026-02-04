import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      letterSpacing: {
        soft: "0.01em"
      },
      lineHeight: {
        airy: "1.75"
      }
    }
  },
  plugins: []
} satisfies Config;
