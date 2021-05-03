const CopyPlugin = require("copy-webpack-plugin");
const { EnvironmentPlugin } = require("webpack");

module.exports = {
  entry: "./src/index.tsx",
  experiments: {
    syncWebAssembly: true,
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        loader: "babel-loader",
        options: {
          presets: [
            [
              "@babel/preset-env",
              {
                corejs: 3,
                useBuiltIns: "entry",
              },
            ],
            [
              "@babel/preset-react",
              {
                runtime: "automatic",
              },
            ],
            "@babel/preset-typescript",
          ],
        },
      },
      {
        test: /\.wasm$/,
        type: "webassembly/sync",
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "resources" }],
    }),
    new EnvironmentPlugin(["SENTRY_DSN"]),
  ],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
};
