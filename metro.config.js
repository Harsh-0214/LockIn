const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force hermes-canary transforms — required for New Architecture (Fabric)
// Expo Go SDK 54 requests hermes-stable in the URL but runs New Arch natively,
// so we must override to hermes-canary so the JS bundle matches.
config.transformer.unstable_transformProfile = 'hermes-canary';

module.exports = config;
