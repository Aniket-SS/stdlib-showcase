// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    'ndarray-page': './src/js/ndarray-page.js',
    'math-page':    './src/js/math-page.js',
    'gold-page':    './src/js/gold-page.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'js'),
  },
  resolve: {
    fallback: {
      path:   false,
      fs:     false,
      buffer: false,   // fixes: Can't resolve 'buffer'
      os:     false,
      stream: false,
    }
  }
};