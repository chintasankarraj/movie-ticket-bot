/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#090A0F',
          surface: '#11131B',
          card: '#171923',
          cardHover: '#1F2230',
          border: '#262B3D',
          borderHover: '#373E56',
        },
        brand: {
          purple: {
            DEFAULT: '#8B5CF6',
            hover: '#7C3AED',
            muted: '#5B21B6',
            glow: 'rgba(139, 92, 246, 0.2)',
          },
          bms: {
            DEFAULT: '#E50914',
            light: '#F87171',
            dark: '#991B1B',
            bg: 'rgba(229, 9, 20, 0.12)',
            border: 'rgba(229, 9, 20, 0.35)',
          },
          district: {
            DEFAULT: '#2563EB',
            light: '#60A5FA',
            dark: '#1D4ED8',
            bg: 'rgba(37, 99, 235, 0.12)',
            border: 'rgba(37, 99, 235, 0.35)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.25)',
        'glow-bms': '0 0 20px -5px rgba(229, 9, 20, 0.25)',
        'glow-district': '0 0 20px -5px rgba(37, 99, 235, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
