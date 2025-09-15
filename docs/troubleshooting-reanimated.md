# Troubleshooting React Native Reanimated v4

## Symptom and Exact Error

**Error:** `Cannot find module react-native-worklets/plugin`

**Context:** This error occurs when using React Native Reanimated v4.x with incorrect Babel configuration. The bundler fails to start and Metro cannot find the required worklets plugin.

## Steps Applied

1. **Verified versions:**
   - expo: 54.0.0
   - react-native-reanimated: ~4.1.0 (starts with 4)

2. **Installed missing dependencies:**
   ```bash
   npx expo install react-native-worklets
   npx expo install react-native-reanimated
   ```

3. **Updated Babel configuration:**
   - Removed `react-native-reanimated/plugin` from babel.config.js
   - Added `react-native-worklets/plugin` as the last plugin
   - Maintained `babel-preset-expo` preset
   - Kept `expo-router/babel` plugin in correct order

4. **Verified installation:**
   ```bash
   npm ls react-native-reanimated react-native-worklets
   ```

5. **Cleared cache and restarted:**
   ```bash
   npx expo start -c
   ```

## Rule: Babel Configuration for Reanimated v4

**For React Native Reanimated v4.x, use ONLY `react-native-worklets/plugin` in Babel configuration.**

```javascript
// babel.config.js - CORRECT for Reanimated v4
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      'react-native-worklets/plugin'  // Last plugin for Reanimated v4
    ],
  };
};
```

**DO NOT use `react-native-reanimated/plugin` with Reanimated v4.**

## Useful Commands

- **Check installed versions:** `npm ls react-native-reanimated react-native-worklets`
- **Start with clean cache:** `npx expo start -c` or `npm run start:clean`
- **Run dependency doctor:** `npm run doctor`
- **Clean start script:** `npm run start:clean`

## Dependencies Required for Reanimated v4

- `react-native-reanimated`: ~4.1.0
- `react-native-worklets`: 0.5.x (auto-installed by expo install)

## Verification

After applying the fix:
1. Metro bundler starts without errors
2. No "Cannot find module react-native-worklets/plugin" error
3. Reanimated animations work correctly in the app
4. Expo Go can load the app successfully

## Prevention

- Always use `react-native-worklets/plugin` for Reanimated v4
- Never mix Reanimated v3 and v4 Babel plugins
- Use `npx expo install` for dependency management
- Keep babel.config.js plugins in correct order
