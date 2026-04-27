/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#A78BFA', // Light purple
        secondary: '#F3F4F6', // Light gray
        accent: '#4C1D95', // Dark purple
        background: '#F9FAFB', // Background color
        text: '#1F2937', // Dark text color
      },
      borderRadius: {
        'rounded': '12px',
      },
    },
  },
  plugins: [],
};