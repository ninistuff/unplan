// app/results/components/POIBadge.tsx
import React from "react";
import { Text, View, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../../../lib/ThemeProvider";

interface POIBadgeProps {
  text: string;
  variant?: "default" | "time" | "distance" | "cost" | "transit";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function POIBadge({ text, variant = "default", style, textStyle }: POIBadgeProps) {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case "time":
        return {
          backgroundColor: "#fef3c7",
          borderColor: "#f59e0b",
          textColor: "#92400e",
        };
      case "distance":
        return {
          backgroundColor: "#dbeafe",
          borderColor: "#3b82f6",
          textColor: "#1e40af",
        };
      case "cost":
        return {
          backgroundColor: "#dcfce7",
          borderColor: "#22c55e",
          textColor: "#15803d",
        };
      case "transit":
        return {
          backgroundColor: "#0ea5e9" + "15",
          borderColor: "#0ea5e9",
          textColor: "#0ea5e9",
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderSoft,
          textColor: theme.colors.textSecondary,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: variantStyles.backgroundColor,
          borderWidth: 1,
          borderColor: variantStyles.borderColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            fontSize: 12,
            fontWeight: "600",
            color: variantStyles.textColor,
          },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

interface MetaInfoRowProps {
  timeText: string;
  distanceText: string;
  costText: string;
  lang: "en" | "ro";
}

export function MetaInfoRow({ timeText, distanceText, costText, lang }: MetaInfoRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#f8f9fa",
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
      }}
    >
      <View style={{ alignItems: "center", flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#6c757d", marginBottom: 2 }}>
          {lang === "ro" ? "Timp" : "Time"}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#212529" }}>⏱️ {timeText}</Text>
      </View>
      <View style={{ alignItems: "center", flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#6c757d", marginBottom: 2 }}>
          {lang === "ro" ? "Distanță" : "Distance"}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#212529" }}>📍 {distanceText}</Text>
      </View>
      <View style={{ alignItems: "center", flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#6c757d", marginBottom: 2 }}>
          {lang === "ro" ? "Cost" : "Cost"}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#212529" }}>💰 {costText}</Text>
      </View>
    </View>
  );
}

interface TransitBadgeProps {
  transitType: "metro" | "bus";
  name: string;
}

export function TransitBadge({ transitType, name }: TransitBadgeProps) {
  const badge = transitType === "metro" ? "M" : "B";
  const displayName = name || (transitType === "metro" ? "Stație metrou" : "Stație bus");

  return (
    <POIBadge
      text={`${badge} ${displayName}`}
      variant="transit"
      style={{ alignSelf: "flex-start", marginBottom: 8 }}
    />
  );
}

// Memoized version for performance
export const MemoizedPOIBadge = React.memo(POIBadge);
