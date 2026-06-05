/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bepmam-green': '#1f8555',
        'bepmam-green-dark': '#145c3a',
        'bepmam-bg-dark': '#0b4a31',
      }
    },
  },
  plugins: [],
}
