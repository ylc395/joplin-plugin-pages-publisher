const path = require('path');

/* eslint-env node */
module.exports = {
  plugins: {
    tailwindcss: { config: path.resolve(__dirname, './tailwind.config.js') },
    autoprefixer: {},
  },
};
