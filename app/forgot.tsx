import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useAuth } from "../lib/auth";
import { t } from "../lib/i18n";
import { color, radii, spacing, cardStyle, shadows } from "../constants/theme";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const lang = (user?.profile?.language ?? "en") as "en" | "ro";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) {
      Alert.alert(
        lang === "ro" ? "Introdu emailul" : "Enter email",
        lang === "ro"
          ? "Te rugăm să introduci emailul contului."
          : "Please enter your account email.",
      );
      return;
    }
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
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
              {t(lang, "forgotTitle")}
            </Text>
            <Text style={{ textAlign: "center", color: color.textMuted, marginTop: spacing.sm }}>
              {lang === "ro"
                ? "Introdu emailul și îți trimitem instrucțiuni."
                : "Enter your email and we’ll send reset instructions."}
            </Text>
            {sent ? (
              <Text style={{ color: "#16a34a", textAlign: "center", marginTop: spacing.sm }}>
                {t(lang, "sentIfExists")}
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
                    {loading
                      ? lang === "ro"
                        ? "Se trimite..."
                        : "Sending..."
                      : t(lang, "sendReset")}
                  </Text>
                </Pressable>
                <Text style={{ textAlign: "center", color: color.text }}>
                  {t(lang, "backToLogin")}{" "}
                  <Link href="/login" style={{ color: color.accent, fontWeight: "700" }}>
                    {t(lang, "login")}
                  </Link>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function LabeledInput({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
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
