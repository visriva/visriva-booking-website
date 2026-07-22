/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          dark: '#011F15',
          deep: '#033524',
          surface: '#064430',
          card: '#022B1E',
          cardHover: '#043A2A',
          border: '#0A5C43',
        },
        gold: {
          DEFAULT: '#D4AF37',
          metallic: '#D4AF37',
          light: '#F5E0A3',
          dark: '#AA841E',
          accent: '#E6C687',
          glow: 'rgba(212, 175, 55, 0.3)',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F5E0A3 0%, #D4AF37 50%, #AA841E 100%)',
        'gold-gradient-hover': 'linear-gradient(135deg, #FFFFFF 0%, #F5E0A3 30%, #D4AF37 100%)',
        'emerald-gradient': 'radial-gradient(circle at top center, #033524 0%, #011F15 80%)',
        'card-glass': 'linear-gradient(180deg, rgba(3, 53, 36, 0.7) 0%, rgba(1, 31, 21, 0.85) 100%)',
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.25)',
        'gold-glow-lg': '0 0 40px rgba(212, 175, 55, 0.4)',
        'emerald-glow': '0 10px 30px rgba(1, 31, 21, 0.8)',
      },
    },
  },
  plugins: [],
};
