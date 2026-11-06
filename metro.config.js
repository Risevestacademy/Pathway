const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer/expo",
);
config.resolver.assetExts = config.resolver.assetExts.filter(
  (extension) => extension !== "svg",
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];
config.resolver.unstable_enablePackageExports = true;

module.exports = config;