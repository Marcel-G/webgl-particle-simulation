const path = require('path')
const webpack = require('webpack')

const isDev = process.env.NODE_ENV === 'development'

let HtmlWebpackPlugin
if (isDev) {
  HtmlWebpackPlugin = require('html-webpack-plugin')
}

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: './index.js',
  optimization: {
    minimize: !isDev
  },
  output: {
    path: path.resolve('./bundle'),
    filename: 'bundle.js',
    library: 'ParticleField',
    umdNamedDefine: true,
    libraryExport: 'default',
    libraryTarget: isDev ? 'umd' : 'commonjs2'
  },
  devtool: 'source-map',
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: 'babel-loader?cacheDirectory'
    },
    {
      test: /\.(svg|png|jpg|webm|mp4|woff|woff2)$/,
      use: 'file-loader'
    },
    { test: /\.(glsl|frag|vert)$/, use: 'raw-loader', exclude: /node_modules/ },
    { test: /\.(glsl|frag|vert)$/, use: 'glslify-loader', exclude: /node_modules/ }]
  },
  plugins: [
    HtmlWebpackPlugin && new HtmlWebpackPlugin({
      template: 'index.html'
    }),
    HtmlWebpackPlugin && new HtmlWebpackPlugin({
      filename: 'capture.html',
      template: 'capture.html'
    })
  ].filter(Boolean)
}
