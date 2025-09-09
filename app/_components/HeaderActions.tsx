import React from "react";
import { View, Pressable, Platform, Image } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";

export default function HeaderActions() {
  const { user } = useAuth();
  const avatar = user?.profile?.avatarUri;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Link href="/favorites" asChild>
        <Pressable hitSlop={10} style={{ marginRight: 8 }} accessibilityRole="button" accessibilityLabel="Favorites">
          <Ionicons name={"heart" as any} size={22} color="#ef4444" />
        </Pressable>
      </Link>
      <Link href="/profile" asChild>
        <Pressable hitSlop={10} style={{ marginRight: 8 }} accessibilityRole="button" accessibilityLabel="Profile">
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#e5e7eb' }} />
          ) : (
            <Ionicons
              name={Platform.select({ ios: "person.circle", android: "person" }) as any}
              size={24}
              color="#2563eb"
            />
          )}
        </Pressable>
      </Link>
    </View>
  );
}

