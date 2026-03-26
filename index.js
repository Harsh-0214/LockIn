'use strict';

/**
 * Custom entry point for Clutch.
 *
 * In Expo Go SDK 54, the native DevSettings module exposes `getDevServer` as
 * a plain Object property instead of a Function. The `react-devtools-core`
 * package (bundled inside react-native) calls `DevSettings.getDevServer()` —
 * a function call — which throws:
 *   TypeError: getDevServer is not a function (it is Object)
 *
 * This crashes the entire runtime before the app can register its entry point.
 *
 * Fix: patch DevSettings.getDevServer to always be callable before any other
 * module has a chance to load react-devtools-core.
 */
try {
  var DevSettings = require('react-native').DevSettings;
  if (DevSettings && typeof DevSettings.getDevServer !== 'function') {
    var _info = DevSettings.getDevServer;
    DevSettings.getDevServer = function getDevServer() {
      return _info != null ? _info : {};
    };
  }
} catch (_) {}

// Load Expo Router normally
require('expo-router/entry');
