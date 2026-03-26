const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ─── Stub react-devtools-core ─────────────────────────────────────────────────
// Expo Go SDK 54 exposes DevSettings.getDevServer as an Object (not a Function).
// react-devtools-core/dist/backend.js calls DevSettings.getDevServer() which
// throws "TypeError: getDevServer is not a function" and crashes the runtime
// before the app entry point is registered.
//
// Fix: redirect every require('react-devtools-core*') to a no-op stub so
// createWebSocketConnection is never invoked.
const DEVTOOLS_STUB = path.resolve(__dirname, 'stubs/react-devtools-core-stub.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-devtools-core' || moduleName.startsWith('react-devtools-core/')) {
    return { type: 'sourceFile', filePath: DEVTOOLS_STUB };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
