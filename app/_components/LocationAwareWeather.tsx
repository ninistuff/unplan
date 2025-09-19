// app/components/LocationAwareWeather.tsx - Location-Aware Weather with Neighborhood
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { color, radii, spacing } from "../../constants/theme";
import { useWeather } from "../../hooks/useWeather";
import { useAuth } from "../../lib/auth";
import { locationService } from "../../lib/locationService";
import {
  detectCity,
  detectNeighborhood,
  getWeatherTip,
  Neighborhood,
} from "../../lib/neighborhoods";

interface LocationData {
  lat: number;
  lon: number;
  neighborhood: Neighborhood | null;
  city?: { id: string; name: string; nameEn: string } | null;
}

export default function LocationAwareWeather() {
  const { user } = useAuth();
  const weather = useWeather();
  const language = (user?.profile?.language ?? "ro") as "ro" | "en";

  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectUserLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[LocationAwareWeather] Starting location detection...");

      // Check if location services are available
      const isAvailable = await locationService.isLocationAvailable();
      if (!isAvailable) {
        setError(
          language === "en"
            ? "Location services are disabled"
            : "Serviciile de locație sunt dezactivate",
        );
        setLoading(false);
        return;
      }

      // Get location using robust service
      const locationResult = await locationService.getCurrentLocation({
        timeout: 15000, // 15 seconds timeout
        useCache: true,
        highAccuracy: true,
      });

      const { latitude: lat, longitude: lon } = locationResult;
      console.log("[LocationAwareWeather] Location detected:", lat.toFixed(6), lon.toFixed(6));
      console.log("[LocationAwareWeather] Accuracy:", locationResult.accuracy, "meters");

      // Detect neighborhood
      const neighborhood = detectNeighborhood(lat, lon);
      console.log("[LocationAwareWeather] Neighborhood detected:", neighborhood?.name || "Unknown");

      // Detect city
      const city = detectCity(lat, lon);
      console.log("[LocationAwareWeather] City detected:", city?.name || "Unknown");

      setLocation({ lat, lon, neighborhood, city });
    } catch (err: unknown) {
      console.error("[LocationAwareWeather] Location detection failed:", err);

      // Try to use cached location first
      const cachedLocation = locationService.getCachedLocation();
      if (cachedLocation) {
        console.log("[LocationAwareWeather] Using cached location as fallback");
        const neighborhood = detectNeighborhood(cachedLocation.latitude, cachedLocation.longitude);
        const city = detectCity(cachedLocation.latitude, cachedLocation.longitude);
        setLocation({
          lat: cachedLocation.latitude,
          lon: cachedLocation.longitude,
          neighborhood,
          city,
        });
        return;
      }

      // Handle specific error types
      const errorCode = (err as any)?.code;
      if (errorCode === "PERMISSION_DENIED") {
        setError(
          language === "en" ? "Location permission denied" : "Permisiunea de locație refuzată",
        );
      } else if (errorCode === "TIMEOUT") {
        setError(language === "en" ? "Location request timed out" : "Cererea de locație a expirat");
      } else if (errorCode === "LOCATION_UNAVAILABLE") {
        setError(
          language === "en"
            ? "Location services unavailable"
            : "Serviciile de locație nu sunt disponibile",
        );
      } else {
        setError(language === "en" ? "Could not detect location" : "Nu s-a putut detecta locația");
      }
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    detectUserLocation();
  }, [detectUserLocation]);

  const getWeatherEmoji = (condition: string, temp: number) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes("rain") || conditionLower.includes("ploaie")) return "🌧️";
    if (conditionLower.includes("cloud") || conditionLower.includes("nor")) return "☁️";
    if (conditionLower.includes("snow") || conditionLower.includes("zăpadă")) return "❄️";
    if (temp > 25) return "☀️";
    if (temp < 10) return "🌤️";
    return "☀️";
  };

  const getTemperatureMessage = (temp: number) => {
    if (temp > 25) {
      return language === "en" ? "Perfect weather for terraces!" : "Vremea perfectă pentru terase!";
    } else if (temp > 20) {
      return language === "en" ? "Great weather for walking!" : "Vreme excelentă pentru plimbări!";
    } else if (temp > 15) {
      return language === "en"
        ? "Nice weather, bring a light jacket!"
        : "Vreme plăcută, ia o jachetă ușoară!";
    } else if (temp > 10) {
      return language === "en"
        ? "Cool weather, dress warmly!"
        : "Vreme răcoroasă, îmbracă-te cald!";
    } else {
      return language === "en" ? "Cold weather, stay warm!" : "Vreme rece, ține-te cald!";
    }
  };

  if (loading) {
    return (
      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: radii.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
          alignItems: "center",
        }}
      >
        <Text style={{ color: color.textMuted, fontSize: 16 }}>
          📍 {language === "en" ? "Detecting your location..." : "Detectez locația ta..."}
        </Text>
      </View>
    );
  }

  if (error) {
    const isPermissionError = error.includes("permission") || error.includes("permisiune");

    return (
      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: radii.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: "#f59e0b",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
          <Ionicons name="location-outline" size={20} color="#f59e0b" />
          <Text style={{ color: "#f59e0b", fontSize: 14, marginLeft: spacing.sm, flex: 1 }}>
            {error}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            onPress={() => detectUserLocation()}
            style={{
              flex: 1,
              backgroundColor: "#f59e0b",
              borderRadius: radii.md,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
              🔄 {language === "en" ? "Retry" : "Încearcă din nou"}
            </Text>
          </Pressable>

          {isPermissionError && (
            <Pressable
              onPress={() => {
                // This would open device settings - for now just show instruction
                alert(
                  language === "en"
                    ? "Please enable location permission in device settings"
                    : "Te rog activează permisiunea de locație în setările dispozitivului",
                );
              }}
              style={{
                flex: 1,
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "#f59e0b",
                borderRadius: radii.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#f59e0b", fontSize: 12, fontWeight: "600" }}>
                ⚙️ {language === "en" ? "Settings" : "Setări"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const neighborhood = location?.neighborhood;
  const temp = weather?.temperature || 20;
  const condition = weather?.condition || "sunny";
  const weatherEmoji = getWeatherEmoji(condition, temp);
  const tempMessage = getTemperatureMessage(temp);

  const cityName = location?.city
    ? language === "en"
      ? location.city.nameEn
      : location.city.name
    : language === "en"
      ? "Your city"
      : "Orașul tău";

  return (
    <View
      style={{
        backgroundColor: color.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: color.borderSoft,
      }}
    >
      {/* Location & Weather Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
        <Ionicons name="location" size={20} color={color.accent} />
        <Text
          style={{
            color: color.text,
            fontSize: 18,
            fontWeight: "700",
            marginLeft: spacing.sm,
            flex: 1,
          }}
        >
          {neighborhood ? (language === "en" ? neighborhood.nameEn : neighborhood.name) : cityName}
        </Text>
        <Text
          style={{
            color: color.text,
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          {weatherEmoji} {temp}°C
        </Text>
      </View>

      {/* Weather Message */}
      <Text
        style={{
          color: color.textMuted,
          fontSize: 16,
          marginBottom: spacing.sm,
          lineHeight: 22,
        }}
      >
        {tempMessage}
      </Text>

      {/* Neighborhood Description */}
      {neighborhood && (
        <Text
          style={{
            color: color.textMuted,
            fontSize: 14,
            marginBottom: spacing.sm,
            fontStyle: "italic",
          }}
        >
          {language === "en" ? neighborhood.descriptionEn : neighborhood.description}
        </Text>
      )}

      {/* Local Weather Tip */}
      {neighborhood && (
        <View
          style={{
            backgroundColor: color.appBg,
            borderRadius: radii.md,
            padding: spacing.md,
            borderLeftWidth: 4,
            borderLeftColor: color.accent,
          }}
        >
          <Text
            style={{
              color: color.text,
              fontSize: 14,
              fontWeight: "600",
              lineHeight: 20,
            }}
          >
            💡 {getWeatherTip(neighborhood, condition, temp, language)}
          </Text>
        </View>
      )}

      {/* Refresh Button */}
      <Pressable
        onPress={() => detectUserLocation()} // Force fresh location
        style={{
          marginTop: spacing.sm,
          alignSelf: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radii.sm,
        }}
      >
        <Text
          style={{
            color: color.accent,
            fontSize: 12,
            fontWeight: "600",
          }}
        >
          🔄 {language === "en" ? "Refresh location" : "Actualizează locația"}
        </Text>
      </Pressable>
    </View>
  );
}
