const daisyui = require("daisyui").default;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    daisyui({
      themes: ["caramellatte --default"],
      logs: false,
    }),
  ],
};
