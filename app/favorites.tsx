import { Link } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View, Share } from "react-native";
import { useFavorites } from "../lib/favorites";
import type { Plan } from "../lib/planTypes";

function metaLine(p: Plan, units: "metric" | "imperial") {
  const distKm = typeof p.km === "number" ? p.km : undefined;
  const dist =
    distKm == null
      ? "-"
      : units === "imperial"
        ? `${Math.round(distKm * 0.621371 * 10) / 10} mi`
        : `${distKm} km`;
  const min = p.min == null ? "-" : `${p.min}`;
  const cost = typeof p.cost === "number" ? `${p.cost} lei` : "0 lei";
  return `~${min} min | ${dist} | ${cost}`;
}

export default function FavoritesScreen() {
  const { list, remove } = useFavorites();
  const [units] = useState<"metric" | "imperial">("metric");

  if (!list || list.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ color: "#475569" }}>No favorites saved yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {list.map(([k, p]) => {
        const title =
          p.title ||
          p.stops
            ?.map((s) => s.name)
            .slice(0, 2)
            .join(" → ") ||
          "Plan";
        const sub = metaLine(p, units);
        return (
          <View
            key={k}
            style={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              ...(Platform.OS === "android" ? { elevation: 1 } : {}),
            }}
          >
            <Text numberOfLines={1} style={{ fontWeight: "700", color: "#0f172a" }}>
              {title}
            </Text>
            <Text style={{ color: "#64748b", marginTop: 4 }}>{sub}</Text>
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <Link
                href={{
                  pathname: "/plan/[id]",
                  params: { id: String(p.id ?? k), payload: JSON.stringify(p) },
                }}
                asChild
              >
                <Pressable
                  style={{
                    backgroundColor: "#2563eb",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 10,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Open</Text>
                </Pressable>
              </Link>
              <Pressable
                onPress={() => remove(k)}
                style={{
                  borderWidth: 1,
                  borderColor: "#ef4444",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: "#ef4444", fontWeight: "700" }}>Remove</Text>
              </Pressable>
              <Pressable
                onPress={() => Share.share({ message: `${title}\n${sub}` }).catch(() => {})}
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#111", fontWeight: "700" }}>Share</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
