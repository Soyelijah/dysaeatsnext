/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          primary: '#0066CC',
          primaryDark: '#004999',
          background: '#F9FAFB',
          surface: '#FFFFFF',
          textMain: '#1F2937',
          success: '#28A745',
          error: '#D32F2F',
          warning: '#FFA000',
        },
        borderRadius: {
          base: '12px',
        },
      },
    },
    plugins: [],
  };
  