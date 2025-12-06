/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Muy importante, para usar 'dark:' basado en clases
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
