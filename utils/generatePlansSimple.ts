// utils/generatePlansSimple.ts - Simplified version with location detection
import * as Location from 'expo-location';
import type { GenerateOptions, Plan } from "../lib/planTypes";

export async function generatePlans(opts: GenerateOptions, signal?: AbortSignal): Promise<Plan[]> {
  if (signal?.aborted) {
    return [
      { id: 'ab-1', title: 'Plan', steps: [], mode: 'foot', km: 0, min: 60 }
    ];
  }


  const checkAbort = (stage: string) => {
    if (signal?.aborted) {
      throw new Error('aborted');
    }
  };



  try {
    // Get user location with timeout, fallback to Bucharest
    let center = { lat: 44.4268, lon: 26.1025 }; // Bucharest fallback

    try {
        checkAbort('before-getCurrentPosition');


      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {


        // Try to get fresh location first

        let locationPromise;

        try {
          // First try: Get fresh location with high accuracy
          locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
        } catch {

          // Fallback: Use balanced accuracy
          locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Location timeout after 8 seconds')), 8000)
        );

        const loc = await Promise.race([locationPromise, timeoutPromise]) as any;

        center = { lat: loc.coords.latitude, lon: loc.coords.longitude };

        // Detailed location logging


        // Check if location is too old (cached)
        const locationAge = Date.now() - loc.timestamp;

        if (locationAge > 5 * 60 * 1000) { // Older than 5 minutes


          try {
            // Try to get a fresh location
            const freshLocationPromise = Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });

            const freshTimeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Fresh location timeout')), 5000)
            );

            const freshLoc = await Promise.race([freshLocationPromise, freshTimeoutPromise]) as any;
            const freshAge = Date.now() - freshLoc.timestamp;

            if (freshAge < locationAge) {
              console.log(`[GeneratePlans] Got fresher location (${Math.round(freshAge / (1000 * 60))} min old)`);
              center = { lat: freshLoc.coords.latitude, lon: freshLoc.coords.longitude };
              console.log(`[GeneratePlans] Updated to fresh coordinates: ${center.lat}, ${center.lon}`);
            }

          }catch { }
        }



        // Verify location is reasonable (not 0,0 or other invalid coordinates)
        if (Math.abs(center.lat) < 0.001 && Math.abs(center.lon) < 0.001) {

          center = { lat: 44.4268, lon: 26.1025 };
        }

        // Check if location is in a reasonable range for Bucharest
        const bucharestLat = 44.4268;
        const bucharestLon = 26.1025;
        const distanceFromBucharest = Math.sqrt(
          Math.pow((center.lat - bucharestLat) * 111000, 2) +
          Math.pow((center.lon - bucharestLon) * 111000 * Math.cos(center.lat * Math.PI / 180), 2)
        );





        if (distanceFromBucharest > 50000) { // More than 50km from Bucharest

        }

      } else {

      }

    }
    catch { }


    // Simple transport mode mapping
    const mode: Plan["mode"] = opts.transport === "bike" ? "bike" :
                              opts.transport === "car" ? "driving" :
                              opts.transport === "public" ? "foot" :
                              "foot";





    // Create POIs relative to user location
    const poi1 = { lat: center.lat + 0.003, lon: center.lon + 0.004 }; // ~400m northeast
    const poi2 = { lat: center.lat + 0.002, lon: center.lon - 0.002 }; // ~250m northwest
    const poi3 = { lat: center.lat - 0.001, lon: center.lon + 0.003 }; // ~200m southeast
    const poi4 = { lat: center.lat + 0.005, lon: center.lon - 0.001 }; // ~500m north
    const poi5 = { lat: center.lat - 0.002, lon: center.lon - 0.003 }; // ~350m southwest
    const poi6 = { lat: center.lat + 0.001, lon: center.lon + 0.005 }; // ~400m east

    // Create 3 simple plans directly
    const plans: Plan[] = [
      {
        id: "simple-1",
        title: "Plan Apropiat",
        steps: [
          { kind: "start", name: "Start", coord: center },
          { kind: "poi", name: "Locație Interesantă", coord: poi1, category: "park" },
          { kind: "poi", name: "Cafenea Locală", coord: poi2, category: "cafe" }
        ],
        mode,
        stops: [
          { name: "Locație Interesantă", lat: poi1.lat, lon: poi1.lon },
          { name: "Cafenea Locală", lat: poi2.lat, lon: poi2.lon }
        ],
        km: 1.2,
        min: Math.min(opts.duration, 90),
        routeSegments: []
      },
      {
        id: "simple-2",
        title: "Plan Cultural",
        steps: [
          { kind: "start", name: "Start", coord: center },
          { kind: "poi", name: "Atracție Culturală", coord: poi3, category: "museum" },
          { kind: "poi", name: "Spațiu Verde", coord: poi4, category: "park" }
        ],
        mode,
        stops: [
          { name: "Atracție Culturală", lat: poi3.lat, lon: poi3.lon },
          { name: "Spațiu Verde", lat: poi4.lat, lon: poi4.lon }
        ],
        km: 1.8,
        min: Math.min(opts.duration, 120),
        routeSegments: []
      },
      {
        id: "simple-3",
        title: "Plan Relaxare",
        steps: [
          { kind: "start", name: "Start", coord: center },
          { kind: "poi", name: "Zonă de Relaxare", coord: poi5, category: "park" },
          { kind: "poi", name: "Cafenea Cozy", coord: poi6, category: "cafe" }
        ],
        mode,
        stops: [
          { name: "Zonă de Relaxare", lat: poi5.lat, lon: poi5.lon },
          { name: "Cafenea Cozy", lat: poi6.lat, lon: poi6.lon }
        ],
        km: 1.5,
        min: Math.min(opts.duration, 105),
        routeSegments: []
      }
    ];


    return plans;

  } catch (error: any) {
    console.error(`[GeneratePlans] ========== GENERATION FAILED ==========`);
    console.error(`[GeneratePlans] Error:`, error);
    console.error(`[GeneratePlans] Stack:`, error?.stack);

    // Return fallback plans

    const fallbackMode = opts.transport === "walk" ? "foot" : opts.transport === "car" ? "driving" : opts.transport === "public" ? "foot" : (opts.transport as "foot" | "bike" | "driving") || "foot";

    const fallbackPlans: Plan[] = [
      {
        id: "fallback-1",
        title: "Plan Simplu A",
        steps: [
          { kind: "start", name: "Start", coord: { lat: 44.4268, lon: 26.1025 } },
          { kind: "poi", name: "Centrul Vechi", coord: { lat: 44.4301, lon: 26.1063 }, category: "park" },
          { kind: "poi", name: "Cafenea Centrală", coord: { lat: 44.4325, lon: 26.1040 }, category: "cafe" }
        ],
        mode: fallbackMode,
        stops: [
          { name: "Centrul Vechi", lat: 44.4301, lon: 26.1063 },
          { name: "Cafenea Centrală", lat: 44.4325, lon: 26.1040 }
        ],
        km: 2,
        min: 60,
        routeSegments: []
      },
      {
        id: "fallback-2",
        title: "Plan Simplu B",
        steps: [
          { kind: "start", name: "Start", coord: { lat: 44.4268, lon: 26.1025 } },
          { kind: "poi", name: "Restaurant Local", coord: { lat: 44.4280, lon: 26.1050 }, category: "bar" },
          { kind: "poi", name: "Parc Herastrau", coord: { lat: 44.4695, lon: 26.0822 }, category: "park" }
        ],
        mode: fallbackMode,
        stops: [
          { name: "Restaurant Local", lat: 44.4280, lon: 26.1050 },
          { name: "Parc Herastrau", lat: 44.4695, lon: 26.0822 }
        ],
        km: 3,
        min: 90,
        routeSegments: []
      },
      {
        id: "fallback-3",
        title: "Plan Simplu C",
        steps: [
          { kind: "start", name: "Start", coord: { lat: 44.4268, lon: 26.1025 } },
          { kind: "poi", name: "Muzeu Național", coord: { lat: 44.4396, lon: 26.0966 }, category: "museum" },
          { kind: "poi", name: "Grădina Cișmigiu", coord: { lat: 44.4370, lon: 26.0914 }, category: "park" }
        ],
        mode: fallbackMode,
        stops: [
          { name: "Muzeu Național", lat: 44.4396, lon: 26.0966 },
          { name: "Grădina Cișmigiu", lat: 44.4370, lon: 26.0914 }
        ],
        km: 2.5,
        min: 75,
        routeSegments: []
      }
    ];


    return fallbackPlans;
  }
}
