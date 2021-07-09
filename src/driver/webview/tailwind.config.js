/* eslint-env node */
module.exports = {
  purge: { content: ['./**/*.vue'] },
  darkMode: false, // or 'media' or 'class'
  important: '#joplin-plugin-content',
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      borderWidth: ['last'],
    },
  },
  plugins: [],
};
