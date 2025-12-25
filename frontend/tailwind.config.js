/** @type {import('tailwindcss').Config} */
export default {
  content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
      "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        // Palet Warna Sinergi Foundation (Estimasi mendekati web asli)
        'sf-green': {
          DEFAULT: '#009846', // Hijau Khas SF
          light: '#28a745',
          dark: '#007033',
        },
        'sf-orange': {
          DEFAULT: '#F68D2E', // Oranye Aksen
          light: '#faa659',
        },
        'sf-gray': '#F3F4F6', // Background abu lembut
      }
    },
  },
  plugins: [require('flowbite/plugin')],
};
