/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111318",
        mist: "#f6f2ea",
        ember: "#ef6a3c",
        moss: "#2f6f54",
        night: "#1c2533",
        gold: "#f7be38"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(17, 19, 24, 0.12)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};
