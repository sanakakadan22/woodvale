/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        shake: "shake 0.75s cubic-bezier(.36,.07,.19,.97) both",
        heartbeat: "heartbeat 1s infinite",
      },
      keyframes: {
        heartbeat: {
          "0%": { transform: "scale(1);" },
          "14%": { transform: "scale(1.3);" },
          "28%": { transform: "scale(1);" },
          "42%": { transform: "scale(1.3);" },
          "70%": { transform: "scale(1);" },
        },
        shake: {
          "10%, 90%": {
            transform: "translate3d(-1px, 0, 0)",
          },
          "20%, 80%": {
            transform: "translate3d(1px, 0, 0)",
          },
          "30%, 50%, 70%": {
            transform: "translate3d(-3px, 0, 0)",
          },
          "40%, 60%": {
            transform: "translate3d(3px, 0, 0)",
          },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        anthology: {
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
      {
        ttpd: {
          primary: "rgba(156,163,175,0.7)",
          secondary: "#c7c7c6",
          accent: "rgba(167,159,149,0.7)",
          neutral: "rgba(30,30,54,0.6)",
          "base-100": "#f5f5f5",
          info: "#0b6ea1",
          success: "#69a41e",
          warning: "rgba(211,84,30,0.77)",
          error: "#d73131",
        },
      },
    ],
  },
};
