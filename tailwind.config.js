/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.html', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        lvs: {
          black: '#000000',
          teal: '#1693A5',
          beige: '#F0F0D8',
          white: '#FFFFFF',
          deep: '#06141a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    }
  },
  plugins: []
};
