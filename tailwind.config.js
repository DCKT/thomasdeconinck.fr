module.exports = {
  mode: "jit",
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./shared/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {
      serif: ["Rubik", "system-ui", "serif"],
      colors: {
        orange: "#ff8a65",
      },
    },
  },
  variants: {
    extend: {
      opacity: ["dark"],
    },
  },
  plugins: [],
};
