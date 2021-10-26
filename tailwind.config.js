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
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        upScale: {
          "0%": { transform: "scale(0.2)", opacity: "0.2" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        wiggle: "wiggle 1s ease-in-out infinite",
        upScale: "upScale 0.75s ease-in",
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
