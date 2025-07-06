/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // חשוב!
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Assistant', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
