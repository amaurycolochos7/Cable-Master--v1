import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cable Master Brand Colors
        primary: {
          DEFAULT: '#E31E24', // Rojo Cable Master
          50: '#FFE5E6',
          100: '#FFCCCD',
          200: '#FF999B',
          300: '#FF6669',
          400: '#FF3337',
          500: '#E31E24',
          600: '#B6181D',
          700: '#891216',
          800: '#5C0C0F',
          900: '#2F0608',
        },
        secondary: {
          DEFAULT: '#1E3C96', // Azul Cable Master
          50: '#E6EAF7',
          100: '#CCD5EF',
          200: '#99ABDF',
          300: '#6681CF',
          400: '#3357BF',
          500: '#1E3C96',
          600: '#183078',
          700: '#12245A',
          800: '#0C183C',
          900: '#060C1E',
        },
        accent: {
          DEFAULT: '#FFD700', // Dorado para highlights
          light: '#FFE44D',
          dark: '#CCAC00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #E31E24 0%, #1E3C96 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, #E31E24 0px, transparent 50%), radial-gradient(at 80% 0%, #1E3C96 0px, transparent 50%), radial-gradient(at 0% 50%, #FFD700 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
};

export default config;
