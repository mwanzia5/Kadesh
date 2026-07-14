/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "deep-navy": "#0D1B3E",
        primary: {
          DEFAULT: "#002f7b",
          container: "#1a469d",
        },
        "vibrant-blue": "#2563EB",
        "hope-orange": {
          DEFAULT: "#F37021",
          dark: "#a04100",
          light: "#fc7728",
        },
        background: "#f8f9ff",
        surface: {
          DEFAULT: "#f8f9ff",
          gray: "#F8FAFC",
        },
        "soft-accent": "#E2E8F0",
        "on-surface": {
          DEFAULT: "#0b1c30",
          variant: "#434652",
        },
        "on-primary": "#ffffff",
        "on-background": "#0b1c30",
        error: "#ba1a1a",
        outline: {
          DEFAULT: "#747783",
          variant: "#c4c6d4",
        },
      },
      fontFamily: {
        display: ['"Source Serif 4"', "Georgia", "serif"],
        body: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["3.75rem", { lineHeight: "4.5rem", fontWeight: "700", letterSpacing: "-0.02em" }],
        "display-lg-mobile": ["2.5rem", { lineHeight: "3rem", fontWeight: "700", letterSpacing: "-0.01em" }],
        "headline-lg": ["2.25rem", { lineHeight: "2.75rem", fontWeight: "600" }],
        "headline-md": ["1.75rem", { lineHeight: "2.25rem", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.875rem", fontWeight: "400" }],
        "body-md": ["1rem", { lineHeight: "1.625rem", fontWeight: "400" }],
        "label-bold": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "700", letterSpacing: "0.05em" }],
        caption: ["0.8125rem", { lineHeight: "1.125rem", fontWeight: "500" }],
      },
      spacing: {
        "section-gap": "120px",
        "margin-mobile": "20px",
        "margin-desktop": "64px",
        gutter: "32px",
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
      },
      maxWidth: {
        container: "1280px",
      },
      boxShadow: {
        card: "0 40px 80px -20px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 50px 100px -20px rgba(0, 0, 0, 0.12)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
      },
      backdropBlur: {
        glass: "12px",
        "glass-card": "8px",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "slide-in-left": "slideInLeft 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "counter-up": "counterUp 2s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
