/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gym-primary': '#6366f1',
        'gym-accent': '#8b5cf6',
      },
      backgroundImage: {
        'gym-gradient': 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #1e293b 100%)',
      },
    },
  },
  plugins: [],
}
