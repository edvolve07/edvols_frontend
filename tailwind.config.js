const config = {
  content: [
    "./src/**/*.{js,jsx,mdx}",
    "./components/**/*.{js,jsx,mdx}",
    "./index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        brand: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#059669",
          600: "#047857",
          700: "#065f46",
          800: "#064e3b",
          900: "#064e3b",
          950: "#022c1f",
        },
        canvas: {
          DEFAULT: "#f4f7f6",
          50:  "#f4f7f6",
          100: "#e8eceb",
          200: "#d1d5d3",
          300: "#a8adab",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8FAFC",
          border: "#E2E8F0",
        },
        accent: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        slate: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        amber: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      borderRadius: {
        'card': '10px',
        'card-lg': '12px',
        'card-sm': '8px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card-elevated': '0 4px 8px rgba(0,0,0,0.04)',
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "wave": "wave 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.5)" },
          "50%":      { transform: "scaleY(1.5)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
