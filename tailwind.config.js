/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: '#E85B3A',
        navy: '#1C2E5C',
        sand: '#FAF7F2',
        ink: '#0F1B33'
      }
    }
  },
  plugins: []
};
