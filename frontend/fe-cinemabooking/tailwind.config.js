/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: '#2a2a2a',
        primary: {
          50: '#fff1f2',
          100: '#ffe1e4',
          200: '#ffc8ce',
          300: '#ff9ca6',
          400: '#ff5b68',
          500: '#e50914',
          600: '#b80710',
          700: '#93060d',
          800: '#690409',
          900: '#460205',
          950: '#240103',
        },
        accent: {
          50: '#fffdf5',
          100: '#f7f3e8',
          200: '#e7dfcd',
          300: '#d4c7ad',
          400: '#b7a27b',
          500: '#9f8357',
          600: '#7c633f',
          700: '#5f4a32',
          800: '#423426',
          900: '#2a2119',
          950: '#17120d',
        },
        dark: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#333333',
          800: '#1f1f1f',
          850: '#171717',
          900: '#0b0b0b',
          950: '#050505',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Arial', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
