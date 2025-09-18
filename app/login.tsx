import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../lib/auth";
import { t } from "../lib/i18n";
import { color, radii, spacing, cardStyle, shadows } from "../constants/theme";

export default function LoginScreen() {
  const { signIn, user } = useAuth() as any;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = (user?.profile?.language ?? "en") as "en" | "ro";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/");
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: color.appBg }}
    >
      <View style={{ flex: 1, backgroundColor: color.appBg }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: spacing.lg,
            padding: spacing.xl,
            paddingBottom: (insets.bottom || 0) + spacing.xl,
          }}
        >
          <View style={{ width: "100%", maxWidth: 460 }}>
            <Text
              style={{ fontSize: 28, fontWeight: "800", textAlign: "center", color: color.text }}
            >
              {t(lang, "enterDetails")}
            </Text>
            {error ? (
              <Text style={{ color: "#dc2626", textAlign: "center", marginTop: spacing.sm }}>
                {error}
              </Text>
            ) : null}
            <View
              style={{ ...cardStyle, ...shadows.md, padding: spacing.xl, marginTop: spacing.lg }}
            >
              <View style={{ gap: spacing.md }}>
                <LabeledInput
                  label={t(lang, "email")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <LabeledInput
                  label={t(lang, "password")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
                {/* Primary action directly under the fields */}
                <Pressable
                  onPress={onSubmit}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? "#9ca3af" : color.accent,
                    paddingVertical: 14,
                    borderRadius: radii.lg,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "white", textAlign: "center", fontWeight: "800", fontSize: 16 }}
                  >
                    {loading ? t(lang, "signingIn") : t(lang, "signIn")}
                  </Text>
                </Pressable>
                <View style={{ alignItems: "center", gap: 2 }}>
                  <Text style={{ textAlign: "center", color: color.text }}>
                    {t(lang, "noAccount")}{" "}
                    <Link href="/register" style={{ color: color.accent, fontWeight: "700" }}>
                      {t(lang, "register")}
                    </Link>
                  </Text>
                  <Link href="/forgot" style={{ color: color.accent, fontWeight: "700" }}>
                    {t(lang, "forgot")}
                  </Link>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function LabeledInput({ label, ...props }: any) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "700", color: color.text }}>{label}</Text>
      <TextInput
        placeholder={label}
        style={{
          borderWidth: 1,
          borderColor: color.borderSoft,
          backgroundColor: color.surface,
          paddingHorizontal: spacing.lg,
          paddingVertical: Platform.select({ ios: 12, default: 10 }),
          borderRadius: radii.md,
        }}
        {...props}
      />
    </View>
  );
}
