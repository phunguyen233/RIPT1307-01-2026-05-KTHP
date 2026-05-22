/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5D4432',
        secondary: '#E9E3DD',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        surface: '#F9F7F5',
        text: '#3E2B1E'
      },
      fontFamily: {
        primary: ['Poppins', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
