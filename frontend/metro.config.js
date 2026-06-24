// metro.config.js — Smart Athlete
// Enables Metro web bundler for react-native-web support.
// When running `expo start --web`, Metro will use react-native-web
// to compile React Native components to browser-compatible code.

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable web platform
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Alias 'react-native' → 'react-native-web' on web platform
// This is handled automatically by expo-router + react-native-web,
// but we keep this explicit for clarity.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
