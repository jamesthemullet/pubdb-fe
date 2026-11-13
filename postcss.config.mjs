// A custom postcss.config.mjs replaces Next.js's built-in PostCSS defaults entirely,
// so postcss-flexbugs-fixes and postcss-preset-env (with Next's documented options)
// are re-declared here alongside the new postcss-custom-media plugin.
const config = {
  plugins: {
    "postcss-flexbugs-fixes": {},
    "@csstools/postcss-global-data": {
      files: ["./src/app/custom-media.css"],
    },
    "postcss-custom-media": {},
    "postcss-preset-env": {
      autoprefixer: {
        flexbox: "no-2009",
      },
      stage: 3,
      features: {
        "custom-properties": false,
        // Next's vendored postcss-preset-env doesn't apply this feature at stage 3;
        // disabled here so the public package's newer cssdb data doesn't add a
        // `font-feature-settings` fallback Next's own build never produced.
        "font-variant-property": false,
      },
    },
  },
};

export default config;
