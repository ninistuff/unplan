// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "node_modules",
      "android",
      "ios",
      ".expo",
      ".expo-shared",
      "dist",
      "build",
      "coverage",
    ],
  },
]);
