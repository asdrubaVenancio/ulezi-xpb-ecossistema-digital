/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  // Modo dark activado via atributo data-theme="dark" no <html>
  darkMode: ['attribute', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      colors: {
        ciano:   { DEFAULT: '#1FA7C9', light: '#38C0E0', dark: '#1585A0' },
        laranja: { DEFAULT: '#F59E0B', light: '#FCD34D' },
        verde:   '#22C55E',
      },
    },
  },
  plugins: [],
};
