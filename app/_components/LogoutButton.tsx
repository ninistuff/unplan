import React from "react";
import { Pressable, Text } from "react-native";
import { useAuth } from "../../lib/auth";

export default function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <Pressable
      onPress={signOut}
      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
      accessibilityLabel="Sign out"
    >
      <Text style={{ color: "#2563eb", fontWeight: "600" }}>Sign out</Text>
    </Pressable>
  );
}
