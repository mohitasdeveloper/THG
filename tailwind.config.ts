import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0b57d0", // MD3 primary color
        "primary-dark": "#0842a0",
        surface: "#ffffff",
        "surface-container": "#f3f4f6", // Surface container low/medium
        "surface-container-highest": "#e3e3e3",
        bg: "#f8f9fa",
        success: "#146c2e",
        danger: "#b3261e",
        warning: "#f9ab00",
        "text-primary": "#1f1f1f",
        "text-secondary": "#444746",
        border: "#747775", // Outline color
        "border-light": "#c7c7c7", // Outline variant
        divider: "#e0e2e0",
      },
      fontFamily: {
        sans: ["Roboto", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        btn: "9999px",
        dialog: "28px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)", // Elevation 1
        fab: "0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px 0 rgba(0, 0, 0, 0.3)", // Elevation 3
        dialog: "0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px 0 rgba(0, 0, 0, 0.3)", // Elevation 3
      },
      keyframes: {
        "fade-slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "60%": { transform: "scale(1.03)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-slide-up": "fade-slide-up 300ms ease-out",
        pop: "pop 400ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
