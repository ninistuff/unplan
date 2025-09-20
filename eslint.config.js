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
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: false }],
      "no-restricted-syntax": [
        "warn",
        {
          selector: "TSAsExpression > TSAnyKeyword",
          message: "Do not use 'as any'",
        },
      ],
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          minimumDescriptionLength: 8,
        },
      ],
    },
  },
]);
