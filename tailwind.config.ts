import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bills: {
          blue: "#00338D",
          red: "#C60C30",
        },
      },
    },
  },
  plugins: [],
};

export default config;
