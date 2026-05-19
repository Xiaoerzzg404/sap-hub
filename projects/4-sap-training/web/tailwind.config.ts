import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15202b",
        mist: "#f5f7fa",
        line: "#dfe5ec",
        sap: "#0f6fbd",
        matcha: "#27755f",
        amber: "#b97618"
      },
      boxShadow: {
        soft: "0 12px 32px rgba(21, 32, 43, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
