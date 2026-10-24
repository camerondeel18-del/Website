import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#0b0d12", panel: "#131722", line: "#252b39", accent: "#8d7cff", mint: "#65e0bc" }, boxShadow: { soft: "0 18px 55px rgba(0,0,0,.24)" } } },
  plugins: []
};
export default config;
