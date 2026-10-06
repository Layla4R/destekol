import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background
        cream: "#F8FAFF",
        beige: "#EEF3FB",
        
        // 🌟 ألوان Brand الديناميكية
        brand: "var(--brand, #0069D2)",
        "brand-dark": "var(--brand-dark, #003C87)",
        "brand-light": "var(--brand-light, #4A9AE8)",
        
        // 🌟 ألوان Accent الديناميكية
        accent: "var(--accent, #F00F5A)",
        "accent-dark": "var(--accent-dark, #C3003C)",
        "accent-light": "var(--accent-light, #FF4D88)",
        
        // Text
        ink: "#1A1A2E",
        muted: "#5C6880",
        // UI
        line: "#DDE4F0",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        // Admin
        sidebar: "#0F1E3D",
        dashbg: "#F4F7FD",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, var(--accent, #F00F5A) 0%, var(--accent-light, #FF4D88) 100%)",
        "brand-gradient": "linear-gradient(135deg, var(--brand-dark, #003C87) 0%, var(--brand, #0069D2) 100%)",
        
        "section-gradient": "linear-gradient(180deg, #F8FAFF 0%, #EEF3FB 100%)",
        "sidebar-gradient": "linear-gradient(180deg, #0F1E3D 0%, #1A3366 100%)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "IBM Plex Sans Arabic", "Tahoma", "Arial", "sans-serif"],
        display: ["var(--font-display)", "IBM Plex Sans Arabic", "Tahoma", "Arial", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;