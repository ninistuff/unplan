import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { useAuth } from "./auth";
import { createTheme, TextSize, Theme, ThemeMode } from "./theme";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  textSize: TextSize;
  setThemeMode: (mode: ThemeMode) => void;
  setTextSize: (size: TextSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(user?.profile?.theme ?? "auto");
  const [textSize, setTextSizeState] = useState<TextSize>(user?.profile?.textSize ?? "medium");

  // Update local state when user profile changes
  useEffect(() => {
    if (user?.profile?.theme && user.profile.theme !== themeMode) {
      setThemeModeState(user.profile.theme);
    }
  }, [user?.profile?.theme, themeMode]);

  useEffect(() => {
    if (user?.profile?.textSize && user.profile.textSize !== textSize) {
      setTextSizeState(user.profile.textSize);
    }
  }, [user?.profile?.textSize, textSize]);

  // Listen to system theme changes for auto mode
  useEffect(() => {
    if (themeMode === "auto") {
      const subscription = Appearance.addChangeListener(() => {
        // Force re-render when system theme changes
        setThemeModeState("auto");
      });
      return () => subscription?.remove();
    }
    return undefined;
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    // Don't update profile immediately - let the auto-save handle it
  };

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    // Don't update profile immediately - let the auto-save handle it
  };

  const theme = createTheme(themeMode, textSize);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        textSize,
        setThemeMode,
        setTextSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
