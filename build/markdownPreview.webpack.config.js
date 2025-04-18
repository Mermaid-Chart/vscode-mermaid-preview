// build/markdownPreview.webpack.config.js
const path = require('path');

module.exports = {
  mode: 'production',
  target: 'web',
  entry: './src/markdown-preview/index.ts',
  output: {
    path: path.resolve(__dirname, '../dist-preview'),
    filename: 'bundle.js',
    clean: true,
    library: {
      type: 'window'
    },
    chunkLoading: false
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "fs": false,
      "path": false
    }
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
    runtimeChunk: false,
    minimize: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [{
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, '../src/markdown-preview/tsconfig.json'),
            transpileOnly: true
          }
        }],
        exclude: /node_modules/
      }
    ]
  },
  devtool: 'source-map'
};
