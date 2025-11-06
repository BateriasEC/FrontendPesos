import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#F15A29",
          dark: "#1a1a1a",
        },
        surface: {
          DEFAULT: '#111111',
          soft: '#1a1a1a',
        }
      },
    },
  },
  plugins: [forms],
};


