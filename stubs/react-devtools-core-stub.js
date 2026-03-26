/**
 * Stub for react-devtools-core
 *
 * Expo Go SDK 54 exposes DevSettings.getDevServer as an Object, not a Function.
 * react-devtools-core/dist/backend.js calls DevSettings.getDevServer() which throws:
 *   TypeError: getDevServer is not a function (it is Object)
 *
 * This crashes the app before the entry point is registered.
 *
 * This stub replaces react-devtools-core entirely so createWebSocketConnection
 * is never called. React rendering and hot-reloading still work; the only loss
 * is the standalone React DevTools panel connection.
 */
'use strict';

function noop() {}

module.exports = {
  connectToDevTools: noop,
  disconnect: noop,
  createWebSocketConnection: noop,
};
