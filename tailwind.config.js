module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./shared/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {
      serif: ["Rubik", "system-ui", "serif"],
      colors: {
        gray: {
          800: "#2e3039",
          900: "#1f2028",
        },
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
        rollingStone: {
          "0%": {
            transform: "translateX(400px) rotate(360deg)",
            opacity: "0.2",
          },
          "65%": { transform: "translateX(0px) rotate(0deg)", opacity: "1" },
          "70%": {
            transform: "translateX(-40px) rotate(-20deg)",
          },
          "100%": { transform: "translateX(0px) rotate(0deg)" },
        },
      },
      animation: {
        wiggle: "wiggle 1s ease-in-out infinite",
        upScale: "upScale 0.75s ease-in",
        rollingStone: "rollingStone 1s ease-in",
      },
    },
  },
  plugins: [],
};
