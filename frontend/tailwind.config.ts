import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        broken: {
          50: "#FCFAF6",
          100: "#FAF7F2", // Main Broken White / Bone surface
          200: "#F4EEE5",
          300: "#EAE0D3",
        },
        espresso: {
          800: "#3D2418",
          900: "#2C1810", // Main Deep Espresso Brown
          950: "#1C110A", // Dark roast text
        },
        cocoa: {
          500: "#8C5E43",
          600: "#6B442E",
          700: "#5A3825", // Secondary warm brown
        },
        caramel: {
          400: "#E0934E",
          500: "#C47D3B", // Warm caramel amber CTA
          600: "#A8652A",
        },
        linen: {
          border: "#E8DFD5",
          muted: "#756155",
        }
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        warm: "0 4px 20px -2px rgba(44, 24, 16, 0.07), 0 2px 6px -1px rgba(44, 24, 16, 0.04)",
        warmLg: "0 10px 25px -3px rgba(44, 24, 16, 0.1), 0 4px 10px -2px rgba(44, 24, 16, 0.05)",
      }
    },
  },
  plugins: [],
};
export default config;
