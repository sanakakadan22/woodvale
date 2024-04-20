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
          primary: "#9ca3af",
          secondary: "#78716c",
          accent: "#A79F95",
          neutral: "#1a1f2e",
          "base-100": "#2b2b2b",
          info: "#0369a1",
          success: "#3f6212",
          warning: "#7c2d12",
          error: "#7f1d1d",
        },
      },
    ],
  },
};
