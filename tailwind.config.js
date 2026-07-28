/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0a',
          900: '#0d0d0f',
          850: '#111113',
          800: '#161618',
          700: '#1e1e22',
          600: '#2a2a30',
        },
        neon: {
          green: '#10b981',
          blue: '#3b82f6',
          emerald: '#34d399',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'neon-green': '0 0 30px -5px rgba(16, 185, 129, 0.5)',
        'neon-blue': '0 0 30px -5px rgba(59, 130, 246, 0.5)',
        'neon-green-lg': '0 0 60px -10px rgba(16, 185, 129, 0.6)',
        'neon-blue-lg': '0 0 60px -10px rgba(59, 130, 246, 0.6)',
      },
    },
  },
  plugins: [],
};
