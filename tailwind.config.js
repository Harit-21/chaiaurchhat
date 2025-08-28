/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF5C5C",
        secondary: "#1A1A1A",
        accent: "#FFD580"
      }
    },
  },
  plugins: [],
}
