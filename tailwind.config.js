/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#EAF0FA',
          100: '#D6E1F2',
          200: '#ADC3E2',
          300: '#7FA0CD',
          400: '#4E78B0',
          500: '#2A548F',
          600: '#1A3A6B',
          700: '#122852',
          800: '#0B1B3A',
          900: '#081230',
          950: '#050B1E',
        },
        brand: {
          DEFAULT: '#C8102E',
          dark: '#9E0B23',
          light: '#E01E3E',
        },
        gold: {
          DEFAULT: '#FFB612',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Inter', 'system-ui', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(8,18,48,0.06), 0 2px 8px rgba(8,18,48,0.05)',
        lift: '0 4px 12px rgba(8,18,48,0.10), 0 12px 28px rgba(8,18,48,0.12)',
        glow: '0 0 0 3px rgba(200,16,46,0.18)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.35s ease-out both',
        pop: 'pop 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};