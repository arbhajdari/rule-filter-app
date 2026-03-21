/** @type {import('tailwindcss').Config} */
module.exports = {
  // Paths to all components and pages for Tailwind to scan
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Setting Inter as the primary sans-serif font for the UI
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};