/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./popup.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        twitter: {
          blue: '#1DA1F2',
          dark: '#14171A',
          light: '#657786',
          lighter: '#AAB8C2',
          lightest: '#E1E8ED',
          extra: '#F7F9FA'
        }
      }
    },
  },
  plugins: [],
}