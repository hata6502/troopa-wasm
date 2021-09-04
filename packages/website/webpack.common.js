// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const CopyPlugin = require("copy-webpack-plugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { EnvironmentPlugin } = require("webpack");

module.exports = {
  entry: "./src/index.tsx",
  experiments: {
    topLevelAwait: true,
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
                corejs: "3.17.2",
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
    ],
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    new CopyPlugin({
      patterns: [{ from: "resources" }],
    }),
    new EnvironmentPlugin(["SENTRY_DSN"]),
  ],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
};
