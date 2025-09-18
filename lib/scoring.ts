// lib/scoring.ts - POI Scoring System
import type { POI, GenerateOptions } from "./planTypes";

export interface ScoringWeights {
  distance: number;
  openStatus: number;
  categoryMatch: number;
  weatherSuitability: number;
  timeOfDayMatch: number;
  accessibilityMatch: number;
}

export interface WeatherConditions {
  isRaining: boolean;
  isHot: boolean; // feels like >= 35°C
  isWindy: boolean;
}

export interface ScoringContext {
  userPrefs: GenerateOptions["userPrefs"];
  withWho: GenerateOptions["withWho"];
  weather: WeatherConditions;
  timeOfDay: number; // 0-23 hours
  maxDistance: number; // for normalization
}

/**
 * Calculate a comprehensive score for a POI based on user preferences,
 * weather conditions, and contextual factors.
 *
 * @param poi - The POI to score
 * @param distanceKm - Distance from user location in kilometers
 * @param context - Scoring context with preferences and conditions
 * @param weights - Scoring weights for different components
 * @returns Numeric score (higher is better)
 */
export function scorePOI(
  poi: POI,
  distanceKm: number,
  context: ScoringContext,
  weights: ScoringWeights,
): number {
  let score = 0;

  // 1. Distance component (normalized, closer is better)
  const distanceScore = Math.max(0, 1 - distanceKm / context.maxDistance);
  score += distanceScore * weights.distance;

  // 2. Open status component
  const openScore = getOpenStatusScore(poi);
  score += openScore * weights.openStatus;

  // 3. Category match component
  const categoryScore = getCategoryMatchScore(poi, context);
  score += categoryScore * weights.categoryMatch;

  // 4. Weather suitability component
  const weatherScore = getWeatherSuitabilityScore(poi, context.weather);
  score += weatherScore * weights.weatherSuitability;

  // 5. Time of day match component
  const timeScore = getTimeOfDayScore(poi, context.timeOfDay);
  score += timeScore * weights.timeOfDayMatch;

  // 6. Accessibility match component
  const accessibilityScore = getAccessibilityScore(poi, context);
  score += accessibilityScore * weights.accessibilityMatch;

  return score;
}

/**
 * Get score based on POI open status
 */
function getOpenStatusScore(poi: POI): number {
  if (!poi.opening_hours) return 0.5; // Unknown status

  switch (poi.opening_hours.status) {
    case "open":
      return 1.0;
    case "closed":
      return 0.1; // Heavy penalty for closed
    case "unknown":
    default:
      return 0.5;
  }
}

/**
 * Get score based on category match with user preferences
 */
function getCategoryMatchScore(poi: POI, context: ScoringContext): number {
  const category = poi.category;
  const { withWho, userPrefs } = context;

  // Base category preferences
  let score = 0.5; // Default neutral score

  // Match with "with who" preferences
  switch (withWho) {
    case "family":
      if (["playground", "zoo", "aquarium", "museum", "park"].includes(category)) {
        score += 0.4;
      }
      break;
    case "friends":
      if (["bar", "pub", "restaurant", "cinema", "arcade", "bowling_alley"].includes(category)) {
        score += 0.4;
      }
      break;
    case "partner":
      if (["cafe", "restaurant", "gallery", "cinema", "wine_bar"].includes(category)) {
        score += 0.4;
      }
      break;
    case "pet":
      // Only boost if explicitly pet-friendly
      if (poi.tags?.["dog"] === "yes" || poi.tags?.["pets"] === "yes") {
        score += 0.3;
      } else {
        score -= 0.2; // Slight penalty if not explicitly pet-friendly
      }
      break;
  }

  // Match with user activity preferences
  if (userPrefs?.activity) {
    switch (userPrefs.activity) {
      case "active":
        if (["sports_centre", "fitness_centre", "climbing", "swimming_pool"].includes(category)) {
          score += 0.3;
        }
        break;
      case "cultural":
        if (["museum", "gallery", "library", "theatre"].includes(category)) {
          score += 0.3;
        }
        break;
      case "social":
        if (["cafe", "restaurant", "bar", "pub"].includes(category)) {
          score += 0.3;
        }
        break;
    }
  }

  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Get score based on weather suitability
 */
function getWeatherSuitabilityScore(poi: POI, weather: WeatherConditions): number {
  const category = poi.category;
  const isIndoor = isIndoorCategory(category);
  const isOutdoor = isOutdoorCategory(category);

  let score = 0.5; // Default neutral

  // Rain considerations
  if (weather.isRaining) {
    if (isIndoor) {
      score += 0.3; // Boost indoor activities
    } else if (isOutdoor) {
      score -= 0.4; // Penalize outdoor activities
    }
  }

  // Heat considerations
  if (weather.isHot) {
    if (isIndoor) {
      score += 0.2; // Slight boost for indoor
    } else if (isOutdoor) {
      score -= 0.3; // Penalize outdoor activities
    }

    // Special boost for cooling activities
    if (["swimming_pool", "aquarium", "ice_cream"].includes(category)) {
      score += 0.4;
    }
  }

  // Wind considerations
  if (weather.isWindy) {
    if (category === "cycling" || poi.tags?.["sport"] === "cycling") {
      score -= 0.3; // Penalize cycling in wind
    }
  }

  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Get score based on time of day appropriateness
 */
function getTimeOfDayScore(poi: POI, timeOfDay: number): number {
  const category = poi.category;
  let score = 0.5; // Default neutral

  if (timeOfDay >= 7 && timeOfDay < 11) {
    // Morning (7-11)
    if (["cafe", "bakery", "fitness_centre", "park"].includes(category)) {
      score += 0.3;
    }
  } else if (timeOfDay >= 11 && timeOfDay < 17) {
    // Afternoon (11-17)
    if (["museum", "gallery", "restaurant", "shopping"].includes(category)) {
      score += 0.3;
    }
  } else if (timeOfDay >= 17 && timeOfDay < 24) {
    // Evening (17-24)
    if (["bar", "pub", "restaurant", "cinema", "theatre"].includes(category)) {
      score += 0.3;
    }
  } else {
    // Late night/early morning (0-7)
    // Most things get penalty except 24h places
    if (!poi.tags?.["opening_hours"]?.includes("24/7")) {
      score -= 0.4;
    }
  }

  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Get score based on accessibility requirements
 */
function getAccessibilityScore(poi: POI, context: ScoringContext): number {
  const { userPrefs, withWho } = context;
  let score = 0.5; // Default neutral

  // Check for disability accessibility
  const hasDisabilities =
    userPrefs?.disabilities?.mobility ||
    userPrefs?.disabilities?.visual ||
    userPrefs?.disabilities?.hearing ||
    (withWho === "family" && context.userPrefs?.disabilities);

  if (hasDisabilities) {
    if (poi.tags?.["wheelchair"] === "yes") {
      score += 0.3;
    } else if (poi.tags?.["wheelchair"] === "no") {
      score -= 0.4;
    }
  }

  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Check if a category is typically indoor
 */
function isIndoorCategory(category: string): boolean {
  const indoorCategories = [
    "museum",
    "gallery",
    "library",
    "cinema",
    "theatre",
    "shopping_mall",
    "cafe",
    "restaurant",
    "bar",
    "pub",
    "fitness_centre",
    "spa",
    "bowling_alley",
    "arcade",
    "escape_game",
    "aquarium",
  ];
  return indoorCategories.includes(category);
}

/**
 * Check if a category is typically outdoor
 */
function isOutdoorCategory(category: string): boolean {
  const outdoorCategories = [
    "park",
    "playground",
    "zoo",
    "attraction",
    "viewpoint",
    "beach",
    "hiking",
    "cycling",
    "sports_field",
  ];
  return outdoorCategories.includes(category);
}

/**
 * Create a stable tie-breaker for consistent sorting
 */
export function createTieBreaker(poi: POI): string {
  return `${poi.name || "unnamed"}_${poi.lat.toFixed(6)}_${poi.lon.toFixed(6)}`;
}
