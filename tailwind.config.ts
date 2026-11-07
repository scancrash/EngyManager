import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        page: "var(--page)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        muted: "var(--muted)",
        line: "var(--line)",
        input: "var(--input)",
        wp: "var(--wp-bg)",
        task: "var(--task-bg)",
        accent: "var(--accent)",
      },
    },
  },
  plugins: [],
};
export default config;
