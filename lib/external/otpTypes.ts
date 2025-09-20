// lib/external/otpTypes.ts
// Minimal types for OpenTripPlanner (OTP) API responses
// Only includes fields that are actually used by the application

export interface OtpPlace {
  lat?: number;
  lon?: number;
  name?: string;
}

export interface OtpLegGeometry {
  points?: string;
}

export interface OtpLeg {
  mode?: string;
  from?: OtpPlace;
  to?: OtpPlace;
  legGeometry?: OtpLegGeometry;
}

export interface OtpItinerary {
  legs?: OtpLeg[];
}

export interface OtpPlan {
  itineraries?: OtpItinerary[];
}

export interface OtpResponse {
  error?: { msg?: string };
  plan?: OtpPlan;
}

// Type guard for OTP response validation
export function isOtpResponse(obj: unknown): obj is OtpResponse {
  if (typeof obj !== "object" || obj === null) return false;
  const response = obj as Record<string, unknown>;

  // Check if error exists and has correct structure
  if (response.error !== undefined) {
    if (typeof response.error !== "object" || response.error === null) return false;
    const error = response.error as Record<string, unknown>;
    if (error.msg !== undefined && typeof error.msg !== "string") return false;
  }

  // Check if plan exists and has correct structure
  if (response.plan !== undefined) {
    if (typeof response.plan !== "object" || response.plan === null) return false;
    const plan = response.plan as Record<string, unknown>;
    if (plan.itineraries !== undefined && !Array.isArray(plan.itineraries)) return false;
  }

  return true;
}
