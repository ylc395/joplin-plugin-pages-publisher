/* eslint-env node */
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  target: 'web',
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: ['style-loader', 'css-loader'],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.tsx?$/,
        exclude: {
          and: [/node_modules/],
          not: [/lowdb/],
        },
        loader: 'babel-loader',
        options: {
          plugins: [
            [
              'import',
              {
                libraryName: 'ant-design-vue',
                libraryDirectory: 'es',
                style: 'css',
              },
            ],
            '@babel/plugin-proposal-class-properties',
          ],
          presets: [
            ['@babel/preset-typescript', { allExtensions: true }],
            [
              '@babel/preset-env',

              {
                useBuiltIns: 'usage',
                corejs: 3,
                shippedProposals: true,
                targets: {
                  electron: 10, // https://github.com/laurent22/joplin/blob/269ec34c83ba1ffd3f87eac90563779ec35d9e90/packages/app-desktop/package.json#L107
                },
              },
            ],
          ],
        },
      },
    ],
  },
  plugins: [new VueLoaderPlugin()],
};
