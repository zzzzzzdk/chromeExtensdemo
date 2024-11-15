const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

const x = {
  plugins: [
    new CopyWebpackPlugin([
      { from: './src/assets', to: 'static' },
      { from: './thirdParty', to: 'thirdParty' },
      { from: './src/manifest.json' },
      { from: './src/js', to: 'js' },
      { from: './src/html' },
    ]),
  ],
  entry: {
    popup: [
      'core-js/stable',
      'regenerator-runtime/runtime',
      './src/popup/popup.js',
    ],
    background: [
      'core-js/stable',
      'regenerator-runtime/runtime',
      './src/background/index.js',
    ],
    imageSearch: [
      'core-js/stable',
      'regenerator-runtime/runtime',
      './src/imageSearch/imageSearch.js',
    ],
  },

  resolve: {
    extensions: ['.webpack.js', '.js', '.jsx'],
    alias: {
      SRC: path.resolve(__dirname, 'src/'),
      ASSET: path.resolve(__dirname, 'src/assets/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: [/node_modules/],
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(js|ts)$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules/@webcontainer'),
          path.resolve(__dirname, 'node_modules/node-schedule'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-numeric-separator',
            ],
          },
        },
      },
      {
        test: /\.(png|jp(e*)g|svg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              // Convert images < 8kb to base64 strings
              name: 'images/[hash]-[name].[ext]',
            },
          },
        ],
      },
    ],
  },
  output: {
    path: path.resolve('dist'),
    filename: 'js/[name].js',
  },
  devServer: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
};

module.exports = env => {
  if (env === 'prod') {
    x.optimization = {
      minimizer: [new UglifyJsPlugin()],
    };
  } else if (env === 'preProd') {
    x.plugins.push(new BundleAnalyzerPlugin());
  } else {
    x.devtool = 'source-map';
  }
  return x;
};
