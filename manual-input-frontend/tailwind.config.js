/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#E8943A',
          'orange-light': '#F0A855',
          'orange-pale': '#FDF3E7',
          blue: '#4A6580',
          'blue-hover': '#5A7A96',
          'blue-dark': '#2E4A61',
        }
      }
    },
  },
  plugins: [],
}
