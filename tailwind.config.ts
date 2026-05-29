import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:      "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          hi:      "var(--surface-hi)",
        },
        border: {
          DEFAULT: "var(--border)",
          hi:      "var(--border-hi)",
          focus:   "var(--border-focus)",
        },
        text: {
          DEFAULT: "var(--text)",
          mid:     "var(--text-mid)",
          faint:   "var(--text-faint)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          dim:     "var(--accent-dim)",
          hover:   "var(--accent-hover)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        error:   "var(--error)",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans:    ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-space-mono)", "monospace"],
      },
      fontSize: {
        xs:   ["11px", { lineHeight: "1.45" }],
        sm:   ["13px", { lineHeight: "1.5"  }],
        base: ["15px", { lineHeight: "1.6"  }],
        lg:   ["18px", { lineHeight: "1.5"  }],
        xl:   ["22px", { lineHeight: "1.35" }],
        "2xl":["28px", { lineHeight: "1.25" }],
        "3xl":["38px", { lineHeight: "1.15" }],
        "4xl":["52px", { lineHeight: "1.08" }],
      },
      borderRadius: {
        sm:  "4px",
        DEFAULT: "6px",
        md:  "8px",
        lg:  "12px",
        xl:  "16px",
      },
      boxShadow: {
        card:   "0 2px 8px  oklch(0% 0 0 / 40%)",
        raised: "0 8px 24px oklch(0% 0 0 / 50%)",
        modal:  "0 24px 64px oklch(0% 0 0 / 70%)",
        poster: "0 16px 48px oklch(0% 0 0 / 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
