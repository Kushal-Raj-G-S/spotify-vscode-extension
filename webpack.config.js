const path = require('path');

// Extension webpack config (Node.js)
const extensionConfig = {
  name: 'extension',
  entry: './src/extension.ts',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    clean: false
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              module: 'commonjs',
              target: 'ES2020',
              jsx: 'preserve'
            }
          }
        }
      }
    ]
  }
};

// Webview webpack config (Browser)
const webviewConfig = {
  name: 'webview',
  entry: './src/panel/ui/index.tsx',
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'webview.js',
    clean: false
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              module: 'es6',
              target: 'ES2020',
              jsx: 'react-jsx'
            }
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer')
                ]
              }
            }
          }
        ]
      }
    ]
  }
};

module.exports = [extensionConfig, webviewConfig];