const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo Go SDK 54 always requests "hermes-stable" in the bundle URL, but it
// runs New Architecture (Fabric) natively. Serving a hermes-stable bundle to
// a New Arch runtime causes "getDevServer is not a function" at startup.
// Rewrite every incoming bundle request to use hermes-canary instead.
config.server = {
  ...config.server,
  rewriteRequestUrl: (url) => {
    return url.replace(
      'unstable_transformProfile=hermes-stable',
      'unstable_transformProfile=hermes-canary'
    );
  },
};

module.exports = config;
