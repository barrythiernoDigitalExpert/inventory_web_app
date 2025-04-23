/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#D4A017", // Couleur or du logo
          dark: "#B38A13",
          light: "#E6B52C",
        },
        secondary: {
          DEFAULT: "#1E1E1E", // Couleur de fond sombre
          light: "#2D2D2D",
          dark: "#121212",
        },
        neutral: {
          DEFAULT: "#FFFFFF", // Couleur de texte blanc
          gray: "#CCCCCC",
          darkgray: "#888888",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        heading: ["var(--font-montserrat)"],
      },
    },
  },
  plugins: [],
};