import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emeraldBase: "#011F15", // Brand alias → same as emerald-950
        goldAccent: "#D4AF37", // Brand alias → same as gold-500
        emerald: {
          950: "#011F15", // Primary deep emerald background
          900: "#033524", // Card / Section dark emerald
          850: "#054731", // Accent dark emerald
          800: "#085B3F", // Interactive emerald border
          700: "#0D7A56",
        },
        gold: {
          300: "#FBEB9B",
          400: "#F3E5AB", // Light gold typography accent
          500: "#D4AF37", // Primary Metallic Gold
          600: "#B89223", // Darker gold active state
          700: "#917013",
        },
      },
      fontFamily: {
        aylia: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        conya: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        catilya: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        cavona: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        bogale: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        graven: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
        cormorant: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        cinzel: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        bodoni: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
        playfair: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #FBEB9B 0%, #D4AF37 50%, #B89223 100%)",
        "emerald-gradient": "linear-gradient(180deg, #011F15 0%, #033524 50%, #011F15 100%)",
        "radial-emerald": "radial-gradient(circle at center, #054731 0%, #011F15 70%)",
        "gold-glow": "radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "gold-sm": "0 0 15px rgba(212, 175, 55, 0.2)",
        "gold-md": "0 0 25px rgba(212, 175, 55, 0.35)",
        "gold-lg": "0 0 40px rgba(212, 175, 55, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
