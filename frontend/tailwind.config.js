/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
        },
        accent: {
          gold: 'var(--color-accent-gold)',
          warm: 'var(--color-accent-warm)',
        },
      },
      fontFamily: {
        brand: ['var(--font-brand)', 'Tajawal', 'sans-serif'],
        display: ['var(--font-display)', 'DM Serif Display', 'serif'],
        sans: ['var(--font-brand)', 'Plus Jakarta Sans', 'Tajawal', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'premium': '0 4px 24px -4px rgba(0,0,0,0.08), 0 8px 48px -8px rgba(0,0,0,0.04)',
        'premium-lg': '0 8px 40px -8px rgba(0,0,0,0.12), 0 16px 64px -16px rgba(0,0,0,0.06)',
        'glow': '0 0 40px -8px var(--color-primary)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
