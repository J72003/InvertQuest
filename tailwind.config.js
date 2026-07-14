/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        parchment: '#f1e8d0',
        'parchment-dark': '#e8dbbf',
        forest: '#2a4525',
        'forest-light': '#3d6438',
        'forest-muted': '#4a6b45',
        gold: '#a67c2e',
        'gold-light': '#c49a3c',
        rust: '#8b3a1f',
        'rust-light': '#a84a2a',
        // tolerance pill colors
        'sensitive-bg': '#d4edda',
        'sensitive-text': '#1a5c2a',
        'moderate-bg': '#fff3cd',
        'moderate-text': '#7d4e00',
        'tolerant-bg': '#f8d7da',
        'tolerant-text': '#721c24',
      },
      fontFamily: {
        display: ['CormorantGaramond_600SemiBold_Italic'],
        'display-regular': ['CormorantGaramond_400Regular'],
        'display-bold': ['CormorantGaramond_700Bold'],
        body: ['Newsreader_400Regular'],
        'body-italic': ['Newsreader_400Regular_Italic'],
        'body-semibold': ['Newsreader_600SemiBold'],
      },
    },
  },
  plugins: [],
};
