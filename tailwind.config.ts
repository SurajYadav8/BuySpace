import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        "screen-xl": "75rem",
      },
      colors: {
        bg: "#EEF1F6",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#0A0F1A",
          muted: "#3F4A5C",
        },
        primary: {
          DEFAULT: "#0B8F6A",
          soft: "#E6F5EF",
          foreground: "#EEF1F6",
        },
        arkiv: "#C45C26",
        line: "#D7DCE5",
        // legacy aliases used in remaining pages (map to light theme)
        darkmode: "#EEF1F6",
        dark_grey: "#FFFFFF",
        dark_border: "#D7DCE5",
        muted: "#3F4A5C",
        midnight_text: "#0A0F1A",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 10px 40px rgba(18, 20, 26, 0.06)",
        float: "0 8px 30px rgba(18, 20, 26, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
