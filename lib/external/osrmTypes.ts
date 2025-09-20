// lib/external/osrmTypes.ts
// Minimal types for OSRM (Open Source Routing Machine) API responses
// Only includes fields that are actually used by the application

export interface OsrmGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: OsrmGeometry;
}

export interface OsrmResponse {
  routes?: OsrmRoute[];
  code?: string;
  message?: string;
}

// Type guard for OSRM response validation
export function isOsrmResponse(obj: unknown): obj is OsrmResponse {
  if (typeof obj !== "object" || obj === null) return false;
  const response = obj as Record<string, unknown>;

  // Check if routes exists and is an array
  if (response.routes !== undefined && !Array.isArray(response.routes)) return false;

  // Check if code exists and is a string
  if (response.code !== undefined && typeof response.code !== "string") return false;

  // Check if message exists and is a string
  if (response.message !== undefined && typeof response.message !== "string") return false;

  return true;
}
