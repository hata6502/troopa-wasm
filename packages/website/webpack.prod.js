// eslint-disable-next-line @typescript-eslint/no-var-requires
const { merge } = require("webpack-merge");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { GenerateSW } = require("workbox-webpack-plugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "production",
  plugins: [new GenerateSW()],
});
