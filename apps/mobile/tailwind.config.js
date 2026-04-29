/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#120d08",
        lime: "#d7ff5f",
        sand: "#f3eadf",
        clay: "#d7c4aa",
      },
    },
  },
  plugins: [],
};
