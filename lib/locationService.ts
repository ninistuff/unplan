// lib/locationService.ts - Robust Location Detection Service
import * as Location from "expo-location";

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface LocationError {
  code: "PERMISSION_DENIED" | "LOCATION_UNAVAILABLE" | "TIMEOUT" | "UNKNOWN";
  message: string;
}

export class LocationService {
  private static instance: LocationService;
  private lastKnownLocation: LocationResult | null = null;
  private isDetecting = false;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async getCurrentLocation(options?: {
    timeout?: number;
    useCache?: boolean;
    highAccuracy?: boolean;
  }): Promise<LocationResult> {
    const { timeout = 10000, useCache = true, highAccuracy = true } = options || {};

    console.log("[LocationService] Getting current location...");
    console.log("[LocationService] Options:", { timeout, useCache, highAccuracy });

    // Return cached location if available and recent (< 5 minutes)
    if (useCache && this.lastKnownLocation) {
      const age = Date.now() - this.lastKnownLocation.timestamp;
      if (age < 5 * 60 * 1000) {
        // 5 minutes
        console.log(
          "[LocationService] Using cached location, age:",
          Math.round(age / 1000),
          "seconds",
        );
        return this.lastKnownLocation;
      }
    }

    // Prevent multiple simultaneous requests
    if (this.isDetecting) {
      console.log("[LocationService] Already detecting, waiting...");
      await this.waitForDetection();
      if (this.lastKnownLocation) {
        return this.lastKnownLocation;
      }
    }

    this.isDetecting = true;

    try {
      // Step 1: Check and request permissions
      console.log("[LocationService] Checking permissions...");
      const permission = await this.requestLocationPermission();
      if (!permission) {
        throw new Error("PERMISSION_DENIED");
      }

      // Step 2: Get location with timeout
      console.log("[LocationService] Getting location with timeout:", timeout);
      const location = await this.getLocationWithTimeout(timeout, highAccuracy);

      // Step 3: Validate and cache result
      const result: LocationResult = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: Date.now(),
      };

      console.log("[LocationService] Location detected successfully:", {
        lat: result.latitude.toFixed(6),
        lon: result.longitude.toFixed(6),
        accuracy: result.accuracy,
      });

      this.lastKnownLocation = result;
      return result;
    } catch (error: unknown) {
      console.error("[LocationService] Location detection failed:", error);

      // Try to return cached location as fallback
      if (this.lastKnownLocation) {
        console.log("[LocationService] Using cached location as fallback");
        return this.lastKnownLocation;
      }

      // If no cache, try low accuracy as last resort
      if (highAccuracy) {
        console.log("[LocationService] Trying low accuracy as fallback...");
        try {
          return await this.getCurrentLocation({
            timeout: timeout / 2,
            useCache: false,
            highAccuracy: false,
          });
        } catch (fallbackError) {
          console.error("[LocationService] Fallback also failed:", fallbackError);
        }
      }

      throw this.createLocationError(error);
    } finally {
      this.isDetecting = false;
    }
  }

  private async requestLocationPermission(): Promise<boolean> {
    try {
      console.log("[LocationService] Requesting foreground permissions...");
      const { status } = await Location.requestForegroundPermissionsAsync();

      console.log("[LocationService] Permission status:", status);

      if (status === "granted") {
        return true;
      }

      // Check if we already have permission
      const existingStatus = await Location.getForegroundPermissionsAsync();
      console.log("[LocationService] Existing permission status:", existingStatus.status);

      return existingStatus.status === "granted";
    } catch (error) {
      console.error("[LocationService] Permission request failed:", error);
      return false;
    }
  }

  private async getLocationWithTimeout(
    timeout: number,
    highAccuracy: boolean,
  ): Promise<Location.LocationObject> {
    const accuracy = highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced;

    console.log("[LocationService] Getting position with accuracy:", accuracy);

    const locationPromise = Location.getCurrentPositionAsync({
      accuracy,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), timeout);
    });

    return Promise.race([locationPromise, timeoutPromise]);
  }

  private async waitForDetection(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    while (this.isDetecting && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
  }

  private createLocationError(error: unknown): LocationError {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" &&
            error !== null &&
            "toString" in error &&
            typeof error.toString === "function"
          ? error.toString()
          : "Unknown error";

    if (message.includes("PERMISSION_DENIED") || message.includes("denied")) {
      return {
        code: "PERMISSION_DENIED",
        message: "Location permission was denied",
      };
    }

    if (message.includes("TIMEOUT") || message.includes("timeout")) {
      return {
        code: "TIMEOUT",
        message: "Location request timed out",
      };
    }

    if (message.includes("unavailable") || message.includes("disabled")) {
      return {
        code: "LOCATION_UNAVAILABLE",
        message: "Location services are unavailable",
      };
    }

    return {
      code: "UNKNOWN",
      message: `Location error: ${message}`,
    };
  }

  // Get cached location without making new request
  getCachedLocation(): LocationResult | null {
    return this.lastKnownLocation;
  }

  // Clear cached location
  clearCache(): void {
    this.lastKnownLocation = null;
  }

  // Check if location services are available
  async isLocationAvailable(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      console.log("[LocationService] Location services enabled:", enabled);
      return enabled;
    } catch (error) {
      console.error("[LocationService] Error checking location services:", error);
      return false;
    }
  }

  // Get location permission status
  async getPermissionStatus(): Promise<Location.PermissionStatus> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status;
    } catch (error) {
      console.error("[LocationService] Error getting permission status:", error);
      return Location.PermissionStatus.UNDETERMINED;
    }
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
