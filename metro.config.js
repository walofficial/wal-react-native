const { getDefaultConfig } = require('expo/metro-config');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname, {
  // Additional features...
});

const sentryConfig = getSentryExpoConfig(__dirname);
const config = { ...defaultConfig, ...sentryConfig };

module.exports = config;
