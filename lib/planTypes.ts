export type LatLng = { lat: number; lon: number };

export type POI = LatLng & {
  id: string;
  name: string;
  category:
    | "cafe" | "restaurant" | "fast_food" | "tea_room"
    | "bar" | "pub"
    | "cinema" | "library" | "museum" | "gallery"
    | "zoo" | "aquarium" | "attraction"
    | "fitness_centre" | "sports_centre" | "bowling_alley" | "escape_game" | "swimming_pool" | "climbing_indoor"
    | "arcade" | "karaoke" | "spa"
    | "park";
  address?: string;
  imageUrl?: string;
  openStatus?: "open" | "closed" | "unknown";
};

export type PlanStep =
  | { kind: "start"; name: "Start"; coord: LatLng }
  | { kind: "poi"; name: string; coord: LatLng; category: POI["category"] }
  | { kind: "transit"; name: string; coord: LatLng; transit: "bus" | "metro"; stopId?: string; transitAction?: "board" | "alight" };

export type Plan = {
  id: string | number;   // "A" | "B" | "C" | idx
  title: string;         // "Plan A"
  steps: PlanStep[];     // Start -> ... -> ...
  mode: "foot" | "bike" | "driving";
  // New meta for cards
  stops?: Array<{ name: string; lat?: number; lon?: number }>; // short list for UI
  km?: number;
  min?: number;
  cost?: number;
  reason?: string;
  routeSegments?: Array<{
    from: LatLng;
    to: LatLng;
    kind: "foot" | "bike" | "driving" | "bus" | "metro";
    stopId?: string;
    shape?: LatLng[][];
    distance?: number; // in meters
    duration?: number; // in seconds
  }>;
  // For Results card display: absolute nearest public transport boarding suggestion
  boarding?: { mode: "bus" | "metro"; name: string };
};

export type Transport = "walk" | "public" | "car" | "bike";
export type WithWho = "solo" | "friends" | "pet" | "family" | "partner";

export type GenerateOptions = {
  duration: number;          // minutes
  transport?: Transport;
  budget?: number;           // Infinity if unlimited
  firstLeg?: number;         // minutes until first stop
  mood?: number;             // 0..100
  withWho?: WithWho;
  friendsCount?: number;
  friendsExpat?: boolean;
  friendsDisabilities?: boolean;
  petType?: "dog" | "cat";
  familyParents?: boolean;
  familyGrandparents?: boolean;
  familyDisabilities?: boolean;
  childAge?: number;         // 0..17
  shuffle?: boolean;
  // Optional: user profile preferences to tailor sequences
  userPrefs?: {
    age?: number | null;
    dob?: string; // YYYY-MM-DD format for age calculation
    activity?: "relaxed" | "active";
    language?: 'en' | 'ro'; // User's preferred language
    disabilities?: {
      wheelchair?: boolean;
      reducedMobility?: boolean;
      lowVision?: boolean;
      hearingImpairment?: boolean;
      sensorySensitivity?: boolean;
      strollerFriendly?: boolean;
    };
    interests?: string[]; // e.g. ["mancare","sport",...]
  };
};
