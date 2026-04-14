/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FFD93D',
        secondary: '#6BCB77',
        accent: '#4D96FF',
        emphasis: '#FF6B6B',
        bg: '#FFFBF0',
        text: '#2D3436',
        border: '#E9E3D5',
        card: '#FFFFFF',
        muted: '#A8B0B9',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      fontFamily: {
        heading: ['FredokaOne_400Regular'],
        body: ['Nunito_400Regular'],
        bodySemiBold: ['Nunito_600SemiBold'],
        bodyBold: ['Nunito_700Bold'],
      },
      borderRadius: {
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
    },
  },
  plugins: [],
};