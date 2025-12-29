/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // HabitArcade blue/teal palette - dynamic and lively
        primary: {
          50: '#e6fffa',
          100: '#b2f5ea',
          200: '#81e6d9',
          300: '#4fd1c5',
          400: '#38b2ac',
          500: '#319795',
          600: '#2c7a7b',
          700: '#285e61',
          800: '#234e52',
          900: '#1d4044',
        },
        accent: {
          50: '#ebf8ff',
          100: '#bee3f8',
          200: '#90cdf4',
          300: '#63b3ed',
          400: '#4299e1',
          500: '#3182ce',
          600: '#2b6cb0',
          700: '#2c5282',
          800: '#2a4365',
          900: '#1a365d',
        },
        // Habit status colors
        status: {
          empty: '#f3f4f6',
          complete: '#10b981',
          missed: '#ef4444',
          partial: '#3b82f6',
          na: '#9ca3af',
          exempt: '#fbbf24',
          extra: '#047857',
          trending: '#f97316',
          pink: '#ec4899',
        }
      },
      fontFamily: {
        condensed: ['"Roboto Condensed"', '"Arial Narrow"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
