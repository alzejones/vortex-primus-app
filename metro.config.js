const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Optimize Metro bundler performance
config.resolver.platforms = ['ios', 'android', 'web'];

// Exclude heavy dependencies from being processed repeatedly
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
  /node_modules\/.*\/node_modules\/react\/.*/,
  /node_modules\/react-native-reanimated\/.*\/tests\/.*/,
  /node_modules\/.*\/example\/.*/,
  /node_modules\/.*\/examples\/.*/,
  /node_modules\/.*\/docs\/.*/,
  /node_modules\/.*\/\.git\/.*/,
];

// Increase transformer and resolver cache
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Enable Metro cache
config.resetCache = false;

// Optimize resolver performance
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Reduce asset processing overhead
config.transformer.assetPlugins = [];

module.exports = config;