import type { Config } from "tailwindcss";
import daisyui from "daisyui"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      // Chatty Liquid Glass — dark (the signature look)
      {
        glassdark: {
          primary: "#5C78F5",
          "primary-content": "#F5F7FF",
          secondary: "#A58AF5",
          "secondary-content": "#F5F7FF",
          accent: "#75DDF5",
          "accent-content": "#101B43",
          neutral: "#182B64",
          "neutral-content": "#F5F7FF",
          "base-100": "rgb(16 27 67 / 0.55)",        // glass surface
          "base-200": "rgb(12 19 46 / 0.45)",        // deeper glass
          "base-300": "rgb(255 255 255 / 0.10)",     // hairlines/hover
          "base-content": "#F5F7FF",
          info: "#75DDF5",
          success: "#4ADE80",
          warning: "#FBBF24",
          error: "#F87171",
        },
      },
      // Chatty Liquid Glass — light companion
      {
        glasslight: {
          primary: "#345CB6",
          "primary-content": "#F5F7FF",
          secondary: "#8066E8",
          "secondary-content": "#F5F7FF",
          accent: "#0E9DB8",
          "accent-content": "#F5F7FF",
          neutral: "#2A3660",
          "neutral-content": "#F5F7FF",
          "base-100": "rgb(255 255 255 / 0.72)",
          "base-200": "rgb(244 246 255 / 0.55)",
          "base-300": "rgb(16 27 67 / 0.10)",
          "base-content": "#182747",
          info: "#0E9DB8",
          success: "#16A34A",
          warning: "#D97706",
          error: "#DC2626",
        },
      },
    ],
  },
};
export default config;
