// app/results/index.tsx
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  InteractionManager,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../lib/auth";
import { keyForPlan, useFavorites } from "../../lib/favorites";
import { t } from "../../lib/i18n";
import type { GenerateOptions, Plan } from "../../lib/planTypes";
import { useTheme } from "../../lib/ThemeProvider";
import { formatHM, formatKm } from "../../lib/resultsUtils";
import { generatePlans } from "../../utils/generatePlansReal";
import { PlanCard } from "./components/PlanCard";

export default function ResultsScreen() {
  const { theme } = useTheme();
  const rawParams = useLocalSearchParams();
  console.log("[results] rawParams", rawParams);
  const { user } = useAuth();
  const lang = (user?.profile?.language ?? "en") as "en" | "ro";
  const units = (user?.profile?.units ?? "metric") as "metric" | "imperial";
  const favs = useFavorites();
  const inFlight = useRef(false);
  const cancelledRef = useRef(false);
  const requestKeyRef = useRef<string>("");
  const [timeoutBanner, setTimeoutBanner] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);

  type Params = {
    d: number; // minutes 30..720
    t: "walk" | "public" | "car" | "bike";
    w: "friends" | "pet" | "family" | "partner";
    b: number | "inf"; // 0..300 or 'inf'
    fc?: number; // 1..10
    fx?: "0" | "1";
    fd?: "0" | "1";
    pt?: "dog" | "cat";
    fp?: "0" | "1";
    fg?: "0" | "1";
    fa?: "0" | "1";
    ca?: number; // 0..17
    shuffle?: "0" | "1";
    lat?: number;
    lon?: number;
    city?: string;
    lt?: string; // local time ISO
  };

  const { params, appliedFallbacks, normalizedLink, seed } = useMemo(() => {
    const get = (k: string) =>
      Array.isArray((rawParams as any)[k]) ? (rawParams as any)[k]?.[0] : (rawParams as any)[k];
    const toNum = (v: any) => {
      const n = parseInt(String(v ?? ""), 10);
      return Number.isFinite(n) ? n : NaN;
    };
    const inSet = <T extends string>(v: any, allowed: readonly T[]): v is T =>
      allowed.includes(String(v) as T);
    let fallbackUsed = false;

    // Required
    let d = toNum(get("d"));
    if (!Number.isFinite(d) || d < 30 || d > 720) {
      d = 60;
      fallbackUsed = true;
    }

    const allowedT = ["walk", "public", "car", "bike"] as const;
    let t = get("t");
    if (!inSet(t, allowedT)) {
      t = "walk";
      fallbackUsed = true;
    }

    const allowedW = ["friends", "pet", "family", "partner"] as const;
    let w = get("w");
    if (!inSet(w, allowedW)) {
      w = "friends";
      fallbackUsed = true;
    }

    let b: number | "inf" = toNum(get("b"));
    if (!Number.isFinite(b as number)) {
      const bStr = String(get("b") ?? "").toLowerCase();
      if (bStr === "inf" || bStr === "infinity") {
        b = "inf";
      } else {
        b = 100;
        fallbackUsed = true;
      }
    } else if ((b as number) < 0 || (b as number) > 300) {
      b = 100;
      fallbackUsed = true;
    }

    // Optional
    const fc = toNum(get("fc"));
    const fx = get("fx");
    const fd = get("fd");
    const pt = get("pt");
    const fp = get("fp");
    const fg = get("fg");
    const fa = get("fa");
    const ca = toNum(get("ca"));
    const shuffle = get("shuffle");
    const lat = parseFloat(String(get("lat") ?? ""));
    const lon = parseFloat(String(get("lon") ?? ""));
    const city = get("city");
    const lt = get("lt");

    const params: Params = {
      d,
      t,
      w,
      b,
      fc: Number.isFinite(fc) ? fc : undefined,
      fx,
      fd,
      pt: pt === "dog" || pt === "cat" ? pt : undefined,
      fp,
      fg,
      fa,
      ca: Number.isFinite(ca) ? ca : undefined,
      shuffle,
      lat: Number.isFinite(lat) ? lat : undefined,
      lon: Number.isFinite(lon) ? lon : undefined,
      city,
      lt,
    };

    // Normalized link for caching
    const normalizedLink = JSON.stringify(params);

    // Seed for shuffle
    let seed: number | undefined;
    if (params.shuffle === "1") {
      let h = 0;
      for (let i = 0; i < normalizedLink.length; i++) {
        h = (Math.imul(31, h) + normalizedLink.charCodeAt(i)) | 0;
      }
      seed = h >>> 0;
    }

    return { params, appliedFallbacks: fallbackUsed, normalizedLink, seed };
  }, [rawParams, user?.id]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: theme.colors.borderSoft,
        },
        title: {
          fontSize: theme.textSizes.base,
          fontWeight: "800",
          color: theme.colors.text,
          marginBottom: 8,
        },
        badgeRow: {
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          columnGap: 8,
          rowGap: 6,
          marginBottom: 8,
        },
        badge: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.borderSoft,
        },
        badgeText: {
          fontSize: 12,
          fontWeight: "600",
          color: theme.colors.textSecondary,
        },
        stopsLine: {
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
        },
        stopText: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          marginRight: 8,
          marginBottom: 2,
        },
        dot: {
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.colors.borderSoft,
          marginHorizontal: 6,
        },
      }),
    [theme],
  );

  // Small banner when fallbacks applied
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  useEffect(() => {
    if (appliedFallbacks) {
      setShowFallbackBanner(true);
      const id = setTimeout(() => setShowFallbackBanner(false), 3000);
      return () => clearTimeout(id);
    }
  }, [appliedFallbacks]);

  // Debug panel toggle on long press
  const [debugVisible, setDebugVisible] = useState(false);

  // Back to simple local state for stability
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Simple toast implementation
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastVisible, setToastVisible] = useState(false);

  // Get user language preference (memoized for performance)
  const userLang = useMemo(() => user?.profile?.language || "ro", [user?.profile?.language]);

  const options: GenerateOptions = useMemo(() => {
    // Normalize runtime params to GenerateOptions
    return {
      duration: params.d,
      transport: params.t,
      budget: params.b === "inf" ? Infinity : params.b,
      withWho: ((): GenerateOptions["withWho"] => {
        // map to lib/planTypes WithWho (has 'solo')
        switch (params.w) {
          case "friends":
            return "friends";
          case "pet":
            return "pet";
          case "family":
            return "family";
          case "partner":
            return "partner";
          default:
            return "solo";
        }
      })(),
      friendsCount: params.fc,
      friendsExpat: params.fx === "1",
      friendsDisabilities: params.fd === "1",
      petType: params.pt,
      familyParents: params.fp === "1",
      familyGrandparents: params.fg === "1",
      familyDisabilities: params.fa === "1",
      childAge: params.ca,
      shuffle: params.shuffle === "1",
      center:
        Number.isFinite(params.lat as any) && Number.isFinite(params.lon as any)
          ? { lat: params.lat as number, lon: params.lon as number }
          : undefined,
      userPrefs: {
        age: undefined,
        dob: user?.profile?.dob,
        language: user?.profile?.language,
        activity: user?.profile?.preferences.activity,
        disabilities: { ...user?.profile?.preferences.disabilities },
        interests: user?.profile?.preferences.interests,
      },
    } as GenerateOptions;
  }, [params, user?.profile]);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    setGenerationProgress(0);

    // watchdog abort
    const aborter = () => {
      cancelledRef.current = true;
      setTimeoutBanner(true);
      setGenerationProgress(100);
    };

    requestKeyRef.current = normalizedLink;
    const controller = new AbortController();
    const sig = controller.signal;
    const guard = setTimeout(() => {
      if (inFlight.current && !cancelledRef.current) {
        controller.abort();
        aborter();
        // Minimal local fallback plan to keep UI responsive
        const fallback: Plan[] = [
          {
            id: "wd-1",
            title: lang === "ro" ? "Plan simplu" : "Simple plan",
            steps: [],
            mode: "foot",
            km: 0,
            min: 60,
          },
        ];
        setPlans(fallback);
      }
    }, 5000);

    try {
      const currentUserLang = user?.profile?.language || "ro";
      const currentOptions = options;

      setCurrentStep(currentUserLang === "ro" ? "Analizez locația..." : "Analyzing location...");
      setGenerationProgress(20);
      await new Promise((resolve) => setTimeout(resolve, 150));

      setCurrentStep(currentUserLang === "ro" ? "Generez planuri..." : "Generating plans...");

      // Debug logging pentru parametrii specificați
      const debugParams = `Duration: ${currentOptions.duration}min, Transport: ${currentOptions.transport}, WithWho: ${currentOptions.withWho}, Budget: ${currentOptions.budget}`;
      console.log("[Results] 🔍 Debug params:", debugParams);
      setDebugInfo(debugParams);

      if (
        currentOptions.duration === 120 &&
        currentOptions.transport === "walk" &&
        currentOptions.withWho === "friends" &&
        currentOptions.budget === 200
      ) {
        console.log("[Results] 🎯 EXACT MATCH: 2h, walk, friends, 200 lei");
        setDebugInfo((prev) => prev + " | 🎯 EXACT MATCH");
      }

      // Generate
      console.log("[Results] using generatePlansReal");
      const resRaw = await generatePlans(currentOptions, sig);
      console.log(
        "[Results] got plans from Real:",
        resRaw?.length,
        resRaw?.map((p) => p.steps.length),
      );

      const arr = Array.isArray(resRaw) ? resRaw : [];
      setPlans(arr);
      console.log("[results] sample plan", arr?.[0]);

      // Move progress to 85% only after generation step completes or aborts
      setGenerationProgress(85);
      if (cancelledRef.current) return;
      if (requestKeyRef.current !== normalizedLink) return;

      setCurrentStep(currentUserLang === "ro" ? "Finalizez..." : "Finalizing...");
      setGenerationProgress(100);

      // Success toast
      setToastMessage(
        currentUserLang === "ro"
          ? "🎉 Planuri generate cu succes!"
          : "🎉 Plans generated successfully!",
      );
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
    } catch (e: any) {
      if (!cancelledRef.current) {
        const currentUserLang = user?.profile?.language || "ro";
        setError(
          e?.message ||
            (currentUserLang === "ro"
              ? "Nu am putut genera planurile"
              : "Failed to generate plans"),
        );
        setToastMessage(
          currentUserLang === "ro"
            ? `❌ Eroare: ${e?.message || "Nu am putut genera planurile"}`
            : `❌ Error: ${e?.message || "Failed to generate plans"}`,
        );
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
      }
    } finally {
      clearTimeout(guard);
      setLoading(false);
      setCurrentStep("");
      inFlight.current = false;
    }
  }, [options, normalizedLink, lang, user?.profile?.language]);

  useEffect(() => {
    if (inFlight.current) return;
    if (requestKeyRef.current === normalizedLink) return;
    const task = InteractionManager.runAfterInteractions(() => {
      load();
    });
    return () => {
      (task as any)?.cancel?.();
    };
  }, [normalizedLink, load]);

  // Debug panel content
  const DebugPanel = () =>
    !debugVisible ? null : (
      <View
        style={{
          position: "absolute",
          bottom: 8,
          left: 16,
          right: 16,
          backgroundColor: "#111827",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#93c5fd", fontWeight: "700", marginBottom: 6 }}>Debug</Text>
        <Text style={{ color: "#f9fafb", fontSize: 12 }}>Params: {JSON.stringify(params)}</Text>
        {params.shuffle === "1" && (
          <Text style={{ color: "#f9fafb", fontSize: 12 }}>Seed: {String(seed ?? "")}</Text>
        )}
        <Text style={{ color: "#d1d5db", fontSize: 12 }}>Link: {normalizedLink}</Text>
      </View>
    );

  // Banner when fallbacks were applied
  const FallbackBanner = () =>
    !showFallbackBanner ? null : (
      <View
        style={{
          position: "absolute",
          top: 8,
          left: 16,
          right: 16,
          backgroundColor: "#fff7ed",
          borderColor: "#fdba74",
          borderWidth: 1,
          padding: 8,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#9a3412", fontSize: 12 }}>
          Some parameters were invalid or missing. Using safe defaults.
        </Text>
      </View>
    );

  const Card = ({ children, panHandlers }: { children: React.ReactNode; panHandlers?: any }) => (
    <View
      {...(panHandlers || {})}
      style={{
        backgroundColor: "#fff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...(Platform.OS === "android" ? { elevation: 1 } : {}),
      }}
    >
      {children}
    </View>
  );

  if (loading) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <FallbackBanner />
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          {t(lang, "plansFor")}
          {formatHM(options.duration)}
        </Text>

        {/* Motivational Message */}
        <View
          style={{
            backgroundColor: "#e3f2fd",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: "#2196f3",
          }}
        >
          <Text style={{ fontSize: 14, color: "#1565c0", fontWeight: "600" }}>
            ✨{" "}
            {lang === "ro" ? "Planuri personalizate pentru tine!" : "Personalized plans for you!"}
          </Text>
          <Text style={{ fontSize: 12, color: "#1976d2", marginTop: 4 }}>
            {lang === "ro"
              ? "Bazate pe vreme, locația ta și preferințele tale"
              : "Based on weather, your location and preferences"}
          </Text>
        </View>

        {/* Enhanced Loading UI with Progress */}
        <View style={{ alignItems: "center", marginTop: 20, marginBottom: 20 }}>
          {/* Enhanced Progress Circle */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#f8f9fa",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
              borderWidth: 4,
              borderColor: "#e9ecef",
              shadowColor: "#007AFF",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#007AFF" }}>
              {generationProgress}%
            </Text>
          </View>

          {/* Current Step with Loading Dots */}
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 8 }}>
              {currentStep || (lang === "ro" ? "Generez planuri..." : "Generating plans...")}
            </Text>
          </View>

          {/* Debug Info */}
          {debugInfo && (
            <Text style={{ fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 8 }}>
              🔍 {debugInfo}
            </Text>
          )}
        </View>

        {/* Skeleton Cards */}
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <View style={{ width: 120, height: 18, backgroundColor: "#e5e7eb", borderRadius: 6 }} />
            <View
              style={{
                marginTop: 8,
                width: "80%",
                height: 14,
                backgroundColor: "#f1f5f9",
                borderRadius: 6,
              }}
            />
            <View
              style={{
                marginTop: 6,
                width: "60%",
                height: 14,
                backgroundColor: "#f1f5f9",
                borderRadius: 6,
              }}
            />
            <View
              style={{
                marginTop: 6,
                width: "70%",
                height: 14,
                backgroundColor: "#f1f5f9",
                borderRadius: 6,
              }}
            />
          </Card>
        ))}
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 16 }}
      >
        <Text style={{ textAlign: "center" }}>{error}</Text>
        <Pressable
          onPress={load}
          style={{
            backgroundColor: "#2563eb",
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>{t(lang, "retry")}</Text>
        </Pressable>
      </View>
    );
  }

  console.log(
    "[Results] plans:",
    plans?.length,
    plans?.map((p) => p.steps.length),
  );

  const valid = plans ? plans.filter((p) => p.steps && p.steps.length >= 1) : [];

  // DEBUG START
  if (valid && valid.length > 0) {
    console.log(
      "[Results] debug plans:",
      valid.map((p) => p.steps.length),
    );
    return (
      <ScrollView style={{ padding: 16 }}>
        {Array.isArray(valid)
          ? valid.map((plan, i) => {
              const stopNames = (plan.steps ?? [])
                .filter((s) => s.kind === "poi")
                .map((s) => s.name);

              return (
                <View key={i} style={styles.card}>
                  <Text style={styles.title}>{plan.title || `Planul ${i + 1}`}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{formatHM(plan.min || 0)}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{formatKm(plan.km || 0)}</Text>
                    </View>
                  </View>
                  <View style={styles.stopsLine}>
                    {stopNames.map((name, i) => (
                      <React.Fragment key={name + i}>
                        {i > 0 && <View style={styles.dot} />}
                        <Text style={styles.stopText}>{name}</Text>
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              );
            })
          : []}
      </ScrollView>
    );
  }
  // DEBUG END

  const shown = Array.isArray(plans)
    ? plans.filter((p) => (p.steps || []).some((s) => s.kind === "poi"))
    : [];

  console.log(
    "[Results] will render",
    shown.map((p) => p.steps.length),
  );

  if (shown.length === 0) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 16 }}
      >
        <Text style={{ textAlign: "center" }}>
          {lang === "ro" ? "Nu avem opriri valide" : "No valid stops"}
        </Text>
        <Pressable
          onPress={load}
          style={{
            backgroundColor: "#2563eb",
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>{t(lang, "retry")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        onLongPress={() => setDebugVisible(!debugVisible)}
      >
        <FallbackBanner />
        <DebugPanel />

        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
          {t(lang, "plansFor")}
          {formatHM(options.duration)}
        </Text>

        {/* Timeout Banner */}
        {timeoutBanner && (
          <View
            style={{
              backgroundColor: "#fecaca",
              borderColor: "#fecaca",
              borderWidth: 1,
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#7f1d1d", fontSize: 12, marginBottom: 6 }}>
              {lang === "ro"
                ? "Rețea lentă — am folosit un fallback local."
                : "Slow network — used local fallback."}
            </Text>
            <Pressable
              onPress={load}
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#991b1b",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                {t(lang, "retry")}
              </Text>
            </Pressable>
          </View>
        )}

        {shown.map((plan, idx) => {
          const isFav = favs.keys.has(keyForPlan(plan));

          return (
            <PlanCard
              key={String(plan.id ?? idx)}
              plan={plan}
              index={idx}
              isFavorite={isFav}
              lang={lang}
              units={units}
              onToggleFavorite={favs.toggle}
            />
          );
        })}
      </ScrollView>

      {/* Simple Toast */}
      {toastVisible && (
        <View
          style={{
            position: "absolute",
            top: 60,
            left: 16,
            right: 16,
            backgroundColor: "#10B981",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            zIndex: 1000,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", flex: 1 }}>
            {toastMessage}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
