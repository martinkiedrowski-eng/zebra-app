import type { Config } from "tailwindcss";

// ZEBRA Design Tokens — siehe Phase-2-Design-System-Dokument.
// Einzige Quelle der Wahrheit für Farben/Fonts; Komponenten referenzieren
// ausschließlich diese Utility-Klassen, keine Hex-Werte inline.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "zebra-void": "#0B0E13",
        "zebra-surface": "#151A22",
        "zebra-surface-raised": "#1C222D",
        "zebra-border": "#262D3A",
        "zebra-blue": "#1E5FD9",
        "zebra-blue-dim": "#16345E",
        "zebra-pulse": "#FF3B4E",
        "zebra-loss": "#8A4550",
        "zebra-ice": "#F4F6FA",
        "zebra-mute": "#8B93A3",
        "zebra-mute-2": "#5B6373",
        "zebra-success": "#2FBF71",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        text: ["var(--font-text)", "sans-serif"],
        mono: ["var(--font-data)", "monospace"],
      },
      borderRadius: {
        card: "8px",
        control: "6px",
        pill: "999px",
      },
      spacing: {
        4.5: "18px",
      },
      keyframes: {
        "stripe-sweep": {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "200% 0%" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "stripe-sweep": "stripe-sweep 1.6s linear infinite",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
