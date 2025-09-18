// app/results/map.tsx
import { router } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { useAuth } from "../../lib/auth";

export default function MapScreen() {
  const { user } = useAuth();
  const lang = (user?.profile?.language ?? "en") as "en" | "ro";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: "#fff",
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
          }}
        >
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
            {lang === "ro" ? "Vedere hartă" : "Map View"}
          </Text>
        </View>

        {/* Map Content */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
          <View
            style={{
              backgroundColor: "#e5e7eb",
              borderRadius: 12,
              padding: 32,
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🗺️</Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
              {lang === "ro" ? "Hartă interactivă" : "Interactive Map"}
            </Text>
            <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}>
              {lang === "ro"
                ? "Vizualizarea pe hartă va fi disponibilă în curând"
                : "Map visualization will be available soon"}
            </Text>
          </View>

          {/* Feature List */}
          <View style={{ width: "100%", maxWidth: 300 }}>
            <FeatureItem
              icon="📍"
              title={lang === "ro" ? "Locații POI" : "POI Locations"}
              description={
                lang === "ro"
                  ? "Vezi toate punctele de interes pe hartă"
                  : "View all points of interest on map"
              }
            />
            <FeatureItem
              icon="🛣️"
              title={lang === "ro" ? "Rute optimizate" : "Optimized Routes"}
              description={
                lang === "ro"
                  ? "Trasee calculate pentru fiecare plan"
                  : "Calculated routes for each plan"
              }
            />
            <FeatureItem
              icon="🚶"
              title={lang === "ro" ? "Navigație pas cu pas" : "Step-by-step Navigation"}
              description={
                lang === "ro"
                  ? "Instrucțiuni detaliate pentru fiecare oprire"
                  : "Detailed instructions for each stop"
              }
            />
          </View>
        </View>

        {/* Footer */}
        <View style={{ padding: 16, backgroundColor: "#fff" }}>
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

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
      }}
    >
      <Text style={{ fontSize: 24, marginRight: 12 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#0f172a", marginBottom: 4 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 14, color: "#6b7280" }}>{description}</Text>
      </View>
    </View>
  );
}
