import 'react-native-gesture-handler';

// app/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth";
import { ThemeProvider, useTheme } from "../lib/ThemeProvider";

function AuthGate() {
  const { user, initializing } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/forgot");
    if (!user && !isAuthRoute) {
      router.replace("/login");
    } else if (user && isAuthRoute) {
      router.replace("/");
    }
  }, [initializing, user, pathname, router]);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading…</Text>
      </View>
    );
  }
  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AuthGate />
        <RootShell />
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootShell() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const avatar = user?.profile?.avatarUri;
  const { theme } = useTheme() as any;
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/forgot");
  const showBottomBar = !!user && !isAuthRoute;
  const showTopBar = !isAuthRoute;
  const topBarHeight = showTopBar ? (insets.top || 0) + 8 : 0;
  const bottomBarHeight = showBottomBar ? 56 + (insets.bottom || 0) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme?.colors.background, paddingTop: topBarHeight, paddingBottom: bottomBarHeight }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="results" />
        <Stack.Screen name="plan/[id]" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot" />
        <Stack.Screen name="profile" />
      </Stack>

      {/* Global top thin bar (hidden on welcome/auth pages) */}
      {showTopBar && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: (insets.top || 0) + 8,
            backgroundColor: theme?.colors.surface,
            borderBottomWidth: 1,
            borderColor: theme?.colors.borderSoft,
            paddingTop: (insets.top || 0),
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 3,
          }}
        />
      )}

      {/* Global bottom bar (Favorites + Profile) - hidden on welcome/auth pages */}
      {showBottomBar && (
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <View
            style={{
              height: 56 + (insets.bottom || 0),
              backgroundColor: theme?.colors.surface,
              borderTopWidth: 1,
              borderColor: theme?.colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingBottom: (insets.bottom || 0),
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: -3 },
              elevation: 3,
            }}
          >
            <Link href="/favorites" asChild>
              <Pressable accessibilityLabel="Favorites" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={"heart" as any} size={22} color={theme?.colors.accent} />
                <Text style={{ fontWeight: '700', color: theme?.colors.text }}>Favorites</Text>
              </Pressable>
            </Link>
            <Link href="/profile" asChild>
              <Pressable accessibilityLabel="Profile" style={{ width: 36, height: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={{ width: 24, height: 24, borderRadius: 12 }} />
                ) : (
                  <Ionicons name={"person" as any} size={22} color="#2563eb" />
                )}
              </Pressable>
            </Link>
          </View>
        </View>
      )}
    </View>
  );
}
