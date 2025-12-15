/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/panel/ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'spotify-green': '#1DB954',
        'spotify-black': '#191414',
        'spotify-dark-gray': '#121212',
        'spotify-gray': '#535353',
        'spotify-light-gray': '#B3B3B3',
      }
    },
  },
  plugins: [],
}