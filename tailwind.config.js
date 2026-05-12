/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        app: "rgb(var(--bg))",
        "app-foreground": "rgb(var(--fg))",
        "app-surface": "rgb(var(--surface))",
        "app-border": "rgb(var(--border))",
        "app-muted": "rgb(var(--muted))",
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        body: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
