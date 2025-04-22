// build/markdownPreview.webpack.config.js
const path = require('path');

module.exports = {
  mode: 'production',
  target: 'web',
  entry: './src/previewmarkdown/markdown-preview/index.ts',
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
    extensions: ['.ts', '.js', '.mjs', '.json'],
    fallback: {
      "fs": false,
      "path": false,
      "tty": false,
      "util": false,
      "os": false
    },
    mainFields: ['module', 'main'],
    alias: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@mermaid-chart/layout-elk': path.resolve(__dirname, '../node_modules/@mermaid-chart/layout-elk/dist/mermaid-layout-elk.core.mjs')
    }
  },
  experiments: {
    topLevelAwait: true
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
            configFile: path.resolve(__dirname, '../tsconfig.json'),
            transpileOnly: true
          }
        }],
        exclude: /node_modules\/(?!@mermaid-chart)/
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        },
        type: "javascript/auto"
      },
      {
        test: /\.json$/,
        type: 'json'
      }
    ]
  },
  devtool: 'source-map'
};
