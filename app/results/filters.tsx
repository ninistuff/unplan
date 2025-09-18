// app/results/filters.tsx
import { router } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { useAuth } from "../../lib/auth";

export default function FiltersScreen() {
  const { user } = useAuth();
  const lang = (user?.profile?.language ?? "en") as "en" | "ro";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: "#e5e7eb",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 16 }}>←</Text>
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>
            {lang === "ro" ? "Filtre" : "Filters"}
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#6b7280", marginBottom: 8 }}>
            🔧 {lang === "ro" ? "În dezvoltare" : "Under Development"}
          </Text>
          <Text style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", marginBottom: 24 }}>
            {lang === "ro"
              ? "Funcționalitatea de filtrare va fi disponibilă în curând."
              : "Filter functionality will be available soon."}
          </Text>

          {/* Placeholder Filter Options */}
          <View style={{ width: "100%", maxWidth: 300 }}>
            <FilterOption
              title={lang === "ro" ? "Tip activitate" : "Activity Type"}
              subtitle={lang === "ro" ? "Cafenele, muzee, parcuri..." : "Cafes, museums, parks..."}
              disabled
            />
            <FilterOption
              title={lang === "ro" ? "Interval de preț" : "Price Range"}
              subtitle={lang === "ro" ? "0-50 lei, 50-100 lei..." : "0-50 lei, 50-100 lei..."}
              disabled
            />
            <FilterOption
              title={lang === "ro" ? "Distanță maximă" : "Max Distance"}
              subtitle={lang === "ro" ? "1km, 2km, 5km..." : "1km, 2km, 5km..."}
              disabled
            />
            <FilterOption
              title={lang === "ro" ? "Evaluare minimă" : "Min Rating"}
              subtitle={lang === "ro" ? "3+ stele, 4+ stele..." : "3+ stars, 4+ stars..."}
              disabled
            />
          </View>
        </View>

        {/* Footer */}
        <View style={{ paddingTop: 16 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              backgroundColor: "#2563eb",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              {lang === "ro" ? "Înapoi la rezultate" : "Back to Results"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface FilterOptionProps {
  title: string;
  subtitle: string;
  disabled?: boolean;
}

function FilterOption({ title, subtitle, disabled = false }: FilterOptionProps) {
  return (
    <View
      style={{
        backgroundColor: disabled ? "#f9fafb" : "#fff",
        borderWidth: 1,
        borderColor: disabled ? "#e5e7eb" : "#d1d5db",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: disabled ? "#9ca3af" : "#0f172a",
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: disabled ? "#9ca3af" : "#6b7280" }}>{subtitle}</Text>
      {disabled && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "#fbbf24",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "600", color: "#92400e" }}>SOON</Text>
        </View>
      )}
    </View>
  );
}
