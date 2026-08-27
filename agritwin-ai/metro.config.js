const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Allow Metro to bundle .glb and .gltf files
if (!config.resolver.assetExts.includes('glb')) {
  config.resolver.assetExts.push('glb', 'gltf');
}

module.exports = withNativeWind(config, { input: "./app/global.css" });
