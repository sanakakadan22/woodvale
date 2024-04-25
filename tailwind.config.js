/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "rgba(156,163,175,0.7)",
          secondary: "#5d5854",
          accent: "rgba(167,159,149,0.7)",
          neutral: "rgba(30,30,54,0.6)",
          "base-100": "#2b2b2b",
          info: "#06405EFF",
          success: "#3f6212",
          warning: "rgba(121,44,18,0.77)",
          error: "#7f1d1d",
        },
      },
    ],
  },
};
