import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pokemon: {
          red: "#E3350D",
          yellow: "#FFCB05",
          blue: "#3B4CCA",
          darkblue: "#003A70",
        },
      },
    },
  },
  plugins: [],
};
export default config;
