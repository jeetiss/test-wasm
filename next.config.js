module.exports = {
  basePath: "/test-wasm",
  assetPrefix: "//raw.githubusercontent.com/jeetiss/test-wasm/gh-pages/",
  future: {
    webpack5: true,
  },
  webpack: (config) => {
    config.module.rules.unshift({
      test: /\.wasm/,
      use: [
        {
          loader: "file-loader",
          options: {
            name: "[contenthash].[ext]",
            publicPath: "_next/static/wasm",
            outputPath: "static/wasm",
          },
        },
      ],
    });

    return config;
  },
};
