// lib/constants.ts
// Application constants for performance optimization and configuration

/**
 * Maximum number of POI items to process per category
 * This limits the computational load during plan generation
 */
export const POI_LIMIT_PER_CATEGORY = 60;

/**
 * Debounce delay in milliseconds for filter changes
 * Prevents excessive API calls and plan regeneration
 */
export const DEBOUNCE_MS = 150;

/**
 * FlatList performance configuration
 */
export const FLATLIST_CONFIG = {
  INITIAL_NUM_TO_RENDER: 8,
  WINDOW_SIZE: 5,
  MAX_TO_RENDER_PER_BATCH: 8,
  REMOVE_CLIPPED_SUBVIEWS: true,
} as const;

/**
 * Distance cache configuration
 */
export const DISTANCE_CACHE_CONFIG = {
  MAX_CACHE_SIZE: 1000,
  COORDINATE_PRECISION: 5, // decimal places for coordinate rounding
} as const;

/**
 * POI filtering configuration
 */
export const POI_FILTER_CONFIG = {
  BOUNDING_BOX_RADIUS_KM: 2, // Initial bounding box radius in kilometers
  EXCLUDED_POI_TYPES: [
    "cemetery",
    "grave_yard",
    "forest",
    "meadow",
    "grass",
    "greenfield",
    "construction",
    "industrial",
    "farmland",
  ],
  REQUIRED_NAME_MIN_LENGTH: 3,
} as const;

/**
 * Opening hours status enum
 */
export const OPENING_HOURS_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
  UNKNOWN: "unknown",
} as const;

export type OpeningHoursStatus = (typeof OPENING_HOURS_STATUS)[keyof typeof OPENING_HOURS_STATUS];

export const TOP_N_POI = 120;
export const TOP_N_MATRIX = 40;

export const SCORING_WEIGHTS = {
  distance: 0.3,
  openStatus: 0.2,
  categoryMatch: 0.25,
  weatherSuitability: 0.15,
  timeOfDayMatch: 0.05,
  accessibilityMatch: 0.05,
} as const;

export const WEATHER_THRESHOLDS = {
  hotC: 30,
  coldC: 0,
  rainMmPerH: 0.2,
  windKph: 35,
  RAIN_PROBABILITY_THRESHOLD: 0.35,
  HOT_FEELS_LIKE_CELSIUS: 30,
  WIND_SPEED_THRESHOLD_KMH: 35,
} as const;
