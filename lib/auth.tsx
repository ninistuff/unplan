import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Local types for auth module
interface NavigatorLike {
  language?: string;
  languages?: readonly string[];
}

interface GlobalWithNavigator {
  navigator?: NavigatorLike;
}

interface IntlLike {
  DateTimeFormat?: () => {
    resolvedOptions?: () => { locale?: string };
  };
}

export type Interests =
  | "mancare"
  | "sport"
  | "natura"
  | "arta"
  | "viata de noapte"
  | "shopping"
  | "creativ"
  | "gaming";

export type UserProfile = {
  name: string;
  dob?: string; // YYYY-MM-DD
  language?: "en" | "ro";
  units?: "metric" | "imperial";
  avatarUri?: string;
  theme?: "light" | "dark" | "auto";
  textSize?: "small" | "medium" | "large";
  preferences: {
    activity: "relaxed" | "active";
    disabilities: {
      wheelchair: boolean;
      reducedMobility: boolean;
      lowVision: boolean;
      hearingImpairment: boolean;
      sensorySensitivity: boolean;
      strollerFriendly: boolean;
    };
    interests: Interests[];
  };
};

export type User = {
  id: string;
  email?: string;
  profile: UserProfile;
};

type AuthContextType = {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "auth:user";

function detectDefaultLang(): "en" | "ro" {
  try {
    const global = globalThis as unknown as GlobalWithNavigator;
    const nav = global.navigator;
    const cand = nav?.language || (Array.isArray(nav?.languages) ? nav.languages[0] : undefined);
    const intl = Intl as unknown as IntlLike;
    const loc = cand || intl?.DateTimeFormat?.()?.resolvedOptions?.()?.locale || "";
    if (String(loc).toLowerCase().startsWith("ro")) return "ro";
  } catch {}
  return "en";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore session from storage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw);
          // Backward compatible shape: ensure profile defaults exist
          const ensured = ensureUserShape(parsed);
          setUser(ensured);
        } else if (!raw && !cancelled) {
          setUser(null);
        }
      } catch {
        // ignore restore errors
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistUser = useCallback(async (u: User | null) => {
    if (u) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const defaultProfile = useMemo<UserProfile>(
    () => ({
      name: "",
      dob: undefined,
      language: detectDefaultLang(),
      units: "metric",
      avatarUri: undefined,
      theme: "auto",
      textSize: "medium",
      preferences: {
        activity: "relaxed",
        disabilities: {
          wheelchair: false,
          reducedMobility: false,
          lowVision: false,
          hearingImpairment: false,
          sensorySensitivity: false,
          strollerFriendly: false,
        },
        interests: [],
      },
    }),
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      // Demo-only: accept any non-empty credentials
      if (!email || !password) throw new Error("Email and password are required");
      const u: User = {
        id: "local:" + Math.random().toString(36).slice(2),
        email,
        profile: defaultProfile,
      };
      setUser(u);
      await persistUser(u);
    },
    [persistUser, defaultProfile],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      // Demo-only: create local user and sign in
      if (!email || !password) throw new Error("Email and password are required");
      const u: User = {
        id: "local:" + Math.random().toString(36).slice(2),
        email,
        profile: defaultProfile,
      };
      setUser(u);
      await persistUser(u);
    },
    [persistUser, defaultProfile],
  );

  const signOut = useCallback(async () => {
    setUser(null);
    await persistUser(null);
  }, [persistUser]);

  const updateProfile = useCallback(
    async (partial: Partial<UserProfile>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const updated: User = {
          ...prev,
          profile: {
            ...prev.profile,
            ...partial,
            preferences: {
              ...prev.profile.preferences,
              ...(partial.preferences ?? {}),
              disabilities: {
                ...prev.profile.preferences.disabilities,
                ...(partial.preferences?.disabilities ?? {}),
              },
              interests: partial.preferences?.interests ?? prev.profile.preferences.interests,
            },
          },
        };
        // Persist asynchronously
        persistUser(updated);
        return updated;
      });
    },
    [persistUser],
  );

  const value = useMemo<AuthContextType>(
    () => ({ user, initializing, signIn, register, signOut, updateProfile }),
    [user, initializing, signIn, register, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

function ensureUserShape(obj: unknown): User {
  const profileDefaults: UserProfile = {
    name: "",
    dob: undefined,
    language: detectDefaultLang(),
    units: "metric",
    avatarUri: undefined,
    theme: "auto",
    textSize: "medium",
    preferences: {
      activity: "relaxed",
      disabilities: {
        wheelchair: false,
        reducedMobility: false,
        lowVision: false,
        hearingImpairment: false,
        sensorySensitivity: false,
        strollerFriendly: false,
      },
      interests: [],
    },
  };
  // Safe property access with type guards
  const objRecord = typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : {};
  const profileRecord =
    typeof objRecord.profile === "object" && objRecord.profile !== null
      ? (objRecord.profile as Record<string, unknown>)
      : {};
  const preferencesRecord =
    typeof profileRecord.preferences === "object" && profileRecord.preferences !== null
      ? (profileRecord.preferences as Record<string, unknown>)
      : {};
  const disabilitiesRecord =
    typeof preferencesRecord.disabilities === "object" && preferencesRecord.disabilities !== null
      ? (preferencesRecord.disabilities as Record<string, unknown>)
      : {};

  const user: User = {
    id:
      typeof objRecord.id === "string"
        ? objRecord.id
        : "local:" + Math.random().toString(36).slice(2),
    email: typeof objRecord.email === "string" ? objRecord.email : undefined,
    profile: {
      ...profileDefaults,
      ...profileRecord,
      preferences: {
        ...profileDefaults.preferences,
        ...preferencesRecord,
        disabilities: {
          ...profileDefaults.preferences.disabilities,
          ...disabilitiesRecord,
        },
        interests: Array.isArray(preferencesRecord.interests)
          ? (preferencesRecord.interests as Interests[])
          : [],
      },
    },
  };
  return user;
}
