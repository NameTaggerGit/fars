/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        apple: '16px',
        'apple-lg': '24px',
      },
      backdropBlur: {
        glass: '12px',
        'glass-lg': '20px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.06)',
        'soft-lg': '0 8px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
