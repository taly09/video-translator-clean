/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // אפשר גם 'media'
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // ברירת מחדל לכל האתר:
        sans: ['Assistant', 'sans-serif'],
        // כל הפונטים שלך:
        rubik: ['Rubik', 'sans-serif'],
        bebas: ['Bebas Neue', 'cursive'],
        assistant: ['Assistant', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
        heebo: ['Heebo', 'sans-serif'],
        impact: ['Impact', 'sans-serif'],
        arialblack: ['Arial Black', 'sans-serif'],
        times: ['"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
};
