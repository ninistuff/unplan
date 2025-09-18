// app/results/components/PlanCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { Platform, Pressable, Share, Text, View } from "react-native";
import type { Plan } from "../../../lib/planTypes";
import { getPlanTheme, getTransportIcon, stopsPreview, metaUnits } from "../../../lib/resultsUtils";
import { MetaInfoRow, TransitBadge } from "./POIBadge";

interface PlanCardProps {
  plan: Plan;
  index: number;
  isFavorite: boolean;
  lang: "en" | "ro";
  units: "metric" | "imperial";
  onToggleFavorite: (plan: Plan) => void;
  onShare?: (plan: Plan) => void;
}

interface CardProps {
  children: React.ReactNode;
  panHandlers?: any;
}

function Card({ children, panHandlers }: CardProps) {
  return (
    <View
      {...(panHandlers || {})}
      style={{
        backgroundColor: "#fff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {children}
    </View>
  );
}

export function PlanCard({
  plan,
  index,
  isFavorite,
  lang,
  units,
  onToggleFavorite,
  onShare,
}: PlanCardProps) {
  // Track re-renders for performance debugging (only in debug mode)
  if (process.env.EXPO_PUBLIC_DEBUG === "true") {
    console.count(`PlanCard render ${plan.id ?? index}`);
  }
  const theme = getPlanTheme(String(plan.id) || String.fromCharCode(65 + (index % 3)), lang);

  const handleShare = () => {
    if (onShare) {
      onShare(plan);
    } else {
      Share.share({
        message: `${plan.title || "Plan"}\n${stopsPreview(plan)}\n${metaUnits(plan, units)}`,
      }).catch(() => {});
    }
  };

  // Extract transit info
  const stepsAny = (plan.steps || []) as any[];
  const transitStep = stepsAny.find(
    (s: any) => s.kind === "transit" && s.transitAction === "board",
  );

  return (
    <Card key={String(plan.id ?? index)}>
      {/* Enhanced Header with Theme */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <View
          style={{
            backgroundColor: theme.color + "20",
            borderRadius: 20,
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 20 }}>{theme.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#0f172a", fontSize: 19, fontWeight: "700" }}>{theme.title}</Text>
          <Text style={{ opacity: 0.7 }}>
            {plan.mode} · {plan.min} min · {plan.km} km
          </Text>
          <Text style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>{theme.description}</Text>
        </View>
        <Text style={{ fontSize: 18, marginLeft: 8 }}>{getTransportIcon(plan.mode || "foot")}</Text>
      </View>

      {/* Transit Info */}
      {transitStep && <TransitBadge transitType={transitStep.transit} name={transitStep.name} />}

      {/* Stops Preview */}
      <Text
        style={{ color: "#475569", marginBottom: 8, lineHeight: 20 }}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {stopsPreview(plan)}
      </Text>

      {/* Enhanced Meta Information */}
      <MetaInfoRow
        timeText={plan.min ? `${plan.min} min` : "-"}
        distanceText={typeof plan.km === "number" ? `${plan.km} km` : "-"}
        costText={typeof plan.cost === "number" ? `${plan.cost} lei` : "0 lei"}
        lang={lang}
      />

      {/* Action Buttons */}
      <View style={{ flexDirection: "row", marginTop: 8, alignItems: "center" }}>
        {/* Map Button */}
        {(plan.steps || []).some((s: any) => s.kind === "poi") && (
          <Link
            href={{
              pathname: "/plan/[id]",
              params: { id: String(plan.id ?? index), payload: JSON.stringify(plan) },
            }}
            asChild
          >
            <Pressable
              android_ripple={{ color: "#dbeafe" }}
              style={{
                backgroundColor: theme.color,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 12,
                marginRight: 8,
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", marginRight: 6 }}>
                {lang === "ro" ? "Vezi pe hartă" : "View on map"}
              </Text>
              <Text style={{ color: "#fff", fontSize: 16 }}>🗺️</Text>
            </Pressable>
          </Link>
        )}

        {/* Favorite Button */}
        <Pressable
          onPress={() => onToggleFavorite(plan)}
          accessibilityLabel={isFavorite ? "Remove favorite" : "Add favorite"}
          style={{
            borderWidth: 1,
            borderColor: isFavorite ? "#ef4444" : "#e5e7eb",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            marginRight: 8,
          }}
        >
          <Ionicons
            name={
              isFavorite
                ? ((Platform.OS === "ios" ? "heart.fill" : "heart") as any)
                : ((Platform.OS === "ios" ? "heart" : "heart-outline") as any)
            }
            size={18}
            color={isFavorite ? "#ef4444" : "#111"}
          />
        </Pressable>

        {/* Share Button */}
        <Pressable
          onPress={handleShare}
          accessibilityLabel="Share plan"
          style={{
            borderWidth: 1,
            borderColor: "#e5e7eb",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#111", fontWeight: "700" }}>Share</Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default React.memo(PlanCard);
