/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#33645c",
        "primary-container": "#4d7d75",
        "on-primary": "#ffffff",
        "on-primary-container": "#f4fffb",
        "primary-fixed": "#b9ede2",
        "primary-fixed-dim": "#9ed1c6",
        "on-primary-fixed": "#00201c",
        "on-primary-fixed-variant": "#1c4f47",
        
        "secondary": "#406183",
        "secondary-container": "#b6d8ff",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#3d5e80",
        "secondary-fixed": "#d0e4ff",
        "secondary-fixed-dim": "#a8caf0",
        
        "tertiary": "#61567b",
        "tertiary-container": "#7a6f95",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#fffbff",
        
        "background": "#eefcfa",
        "on-background": "#111e1d",
        
        "surface": "#eefcfa",
        "surface-dim": "#cedddb",
        "surface-bright": "#eefcfa",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#e8f7f5",
        "surface-container": "#e2f1ef",
        "surface-container-high": "#ddebe9",
        "surface-container-highest": "#d7e5e4",
        "surface-variant": "#d7e5e4",
        "on-surface": "#111e1d",
        "on-surface-variant": "#404846",
        
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        
        "outline": "#707976",
        "outline-variant": "#c0c8c5"
      },
      fontFamily: {
        headline: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'subtle-float': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-8px) scale(1.02)' }
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' }
        }
      },
      animation: {
        'subtle-float': 'subtle-float 8s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite'
      }
    },
  },
  plugins: [],
};
