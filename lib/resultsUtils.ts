// lib/resultsUtils.ts
// Utility functions extracted from Results screen for reusability

import type { Plan } from "./planTypes";

/**
 * Format minutes to human-readable time string
 * @param mins - Number of minutes
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatHM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

/**
 * Format distance to human-readable string
 * @param v - Distance in kilometers
 * @returns Formatted string like "2.5 km" or "800 m"
 */
export function formatKm(v: number): string {
  return v < 1 ? `${Math.round(v * 1000)} m` : `${v.toFixed(1)} km`;
}

/**
 * Get plan theme based on plan ID
 * @param planId - Plan identifier (A, B, C, etc.)
 * @param userLang - User language preference
 * @returns Theme object with emoji, title, color, and description
 */
export function getPlanTheme(planId: string, userLang: "en" | "ro" = "en") {
  switch (planId) {
    case "A":
      return {
        emoji: "⚖️",
        title: userLang === "ro" ? "Echilibrat" : "Balanced",
        color: "#2563eb",
        description: userLang === "ro" ? "Combinație perfectă" : "Perfect combination",
      };
    case "B":
      return {
        emoji: "🎯",
        title: userLang === "ro" ? "Focusat" : "Focused",
        color: "#059669",
        description: userLang === "ro" ? "Direct la țintă" : "Straight to the point",
      };
    case "C":
      return {
        emoji: "🌟",
        title: userLang === "ro" ? "Premium" : "Premium",
        color: "#dc2626",
        description: userLang === "ro" ? "Experiență specială" : "Special experience",
      };
    default:
      return {
        emoji: "📍",
        title: userLang === "ro" ? "Personalizat" : "Custom",
        color: "#7c3aed",
        description: userLang === "ro" ? "Plan personalizat" : "Custom plan",
      };
  }
}

/**
 * Get transport mode icon
 * @param mode - Transport mode
 * @returns Emoji icon for the transport mode
 */
export function getTransportIcon(mode: string): string {
  switch (mode) {
    case "driving":
      return "🚗";
    case "bike":
      return "🚲";
    case "foot":
    default:
      return "🚶";
  }
}

/**
 * Generate stops preview text for a plan
 * @param p - Plan object
 * @returns String with first 3 stops joined by arrows
 */
export function stopsPreview(p: Plan): string {
  const names =
    p.stops?.map((s) => s.name) ??
    (p.steps || [])
      .filter((s: any) => (s as any).kind === "poi")
      .map((s: any) => (s as any).name);
  return (names || []).slice(0, 3).join(" → ");
}

/**
 * Generate meta information string for a plan
 * @param p - Plan object
 * @param units - Unit system (metric or imperial)
 * @returns Formatted meta string with time, distance, and cost
 */
export function metaUnits(p: Plan, units: "metric" | "imperial" = "metric"): string {
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
