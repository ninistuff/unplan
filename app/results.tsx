// app/results.tsx
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager, Platform, Pressable, SafeAreaView, ScrollView, Share, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { keyForPlan, useFavorites } from "../lib/favorites";
import { t } from "../lib/i18n";
import type { GenerateOptions, Plan } from "../lib/planTypes";

import { generatePlans } from "../utils/generatePlansReal";

// Simplified imports for stability
// import { useErrorHandler } from "../lib/errorHandler";
// import { measureAsync } from "../lib/performanceMonitor";
// import { planActions, useAppError, useLoadingStates, usePlans } from "../lib/store";

function clampNum(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function formatHM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "min" : ""}`.trim() : `${m}min`;
}
function mulberry32(a: number) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rand = mulberry32(seed >>> 0);
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


export default function ResultsScreen() {
  const router = useRouter();
  const rawParams = useLocalSearchParams();
  const { user } = useAuth();
  const lang = (user?.profile?.language ?? 'en') as 'en' | 'ro';
  const units = (user?.profile?.units ?? 'metric') as 'metric' | 'imperial';
  const favs = useFavorites();
  const inFlight = useRef(false);
  const cancelledRef = useRef(false);
  const requestKeyRef = useRef<string>("");
  const [timeoutBanner, setTimeoutBanner] = useState(false);


  type Params = {
    d: number; // minutes 30..720
    t: 'walk' | 'public' | 'car' | 'bike';
    w: 'friends' | 'pet' | 'family' | 'partner';
    b: number | 'inf'; // 0..300 or 'inf'
    fc?: number; // 1..10
    fx?: '0' | '1';
    fd?: '0' | '1';
    pt?: 'dog' | 'cat';
    fp?: '0' | '1';
    fg?: '0' | '1';
    fa?: '0' | '1';
    ca?: number; // 0..17
    shuffle?: '0' | '1';
  };

  const { params, appliedFallbacks, normalizedLink, seed } = useMemo(() => {
    const get = (k: string) => (Array.isArray((rawParams as any)[k]) ? (rawParams as any)[k]?.[0] : (rawParams as any)[k]);
    const toNum = (v: any) => {
      const n = parseInt(String(v ?? ''), 10);
      return Number.isFinite(n) ? n : NaN;
    };
    const inSet = <T extends string>(v: any, allowed: readonly T[]): v is T => allowed.includes(String(v) as T);
    let fallbackUsed = false;

    // Required
    let d = toNum(get('d'));
    if (!Number.isFinite(d) || d < 30 || d > 720) { d = 60; fallbackUsed = true; }

    const allowedT = ['walk','public','car','bike'] as const;
    let t = get('t');
    if (!inSet(t, allowedT)) { t = 'walk'; fallbackUsed = true; }

    const allowedW = ['friends','pet','family','partner'] as const;
    let w = get('w');
    if (!inSet(w, allowedW)) { w = 'friends'; fallbackUsed = true; }

    // Optional
    let bRaw = get('b');
    let b: number | 'inf';
    if (bRaw === 'inf') b = 'inf';
    else {
      const bn = toNum(bRaw);
      if (!Number.isFinite(bn)) { b = 200; fallbackUsed = true; }
      else { b = Math.max(0, Math.min(300, bn)); if (bn !== (b as number)) fallbackUsed = true; }
    }

    let fc = toNum(get('fc'));
    if (!Number.isFinite(fc)) { fc = 2; } else { fc = Math.max(1, Math.min(10, fc)); }

    const fx = get('fx') === '1' ? '1' : '0';
    const fd = get('fd') === '1' ? '1' : '0';
    const pt = ((): 'dog' | 'cat' | undefined => {
      const v = get('pt');
      return v === 'dog' || v === 'cat' ? v : undefined;
    })();
    const fp = get('fp') === '1' ? '1' : '0';
    const fg = get('fg') === '1' ? '1' : '0';
    const fa = get('fa') === '1' ? '1' : '0';

    let ca = toNum(get('ca'));
    if (!Number.isFinite(ca)) { ca = 0; } else { ca = Math.max(0, Math.min(17, ca)); }

    const shuffle = get('shuffle') === '1' ? '1' : '0';

    const params: Params = { d, t: t as any, w: w as any, b, fc, fx, fd, pt, fp, fg, fa, ca, shuffle };

    const linkParams: Record<string,string> = {
      d: String(d), t: String(t), w: String(w),
      b: b === 'inf' ? 'inf' : String(b),
      fc: String(fc), fx, fd,
      ...(pt ? { pt } : {}), fp, fg, fa, ca: String(ca), shuffle
    };
    const normalizedLink = `/results?` + Object.entries(linkParams).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');

    // Seed: if shuffle=1, deterministic within session by user id; else undefined
    let seed = undefined as number | undefined;
    if (shuffle === '1') {
      const base = `${(user?.id)||'anon'}`;
      let h = 2166136261;
      for (let i = 0; i < base.length; i++) { h ^= base.charCodeAt(i); h = Math.imul(h, 16777619); }
      seed = h >>> 0;
    }

    return { params, appliedFallbacks: fallbackUsed, normalizedLink, seed };
  }, [rawParams, user?.id]);

  // Small banner when fallbacks applied
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  useEffect(() => { if (appliedFallbacks) { setShowFallbackBanner(true); const id = setTimeout(()=>setShowFallbackBanner(false), 3000); return () => clearTimeout(id); } }, [appliedFallbacks]);

  // Debug panel toggle on long press
  const [debugVisible, setDebugVisible] = useState(false);

  // Back to simple local state for stability
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");

  // Simple toast implementation
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState(false);

  // Removed showToast function - using direct state updates instead

  // Get user language preference (memoized for performance)
  const userLang = useMemo(() => user?.profile?.language || 'ro', [user?.profile?.language]);

  const options: GenerateOptions = useMemo(() => {
    // Normalize runtime params to GenerateOptions
    return {
      duration: params.d,
      transport: params.t,
      budget: params.b === 'inf' ? Infinity : params.b,
      withWho: ((): GenerateOptions['withWho'] => {
        // map to lib/planTypes WithWho (has 'solo')
        switch (params.w) {
          case 'friends': return 'friends';
          case 'pet': return 'pet';
          case 'family': return 'family';
          case 'partner': return 'partner';
          default: return 'solo';
        }
      })(),
      friendsCount: params.fc,
      friendsExpat: params.fx === '1',
      friendsDisabilities: params.fd === '1',
      petType: params.pt,
      familyParents: params.fp === '1',
      familyGrandparents: params.fg === '1',
      familyDisabilities: params.fa === '1',
      childAge: params.ca,
      shuffle: params.shuffle === '1',
      userPrefs: {
        age: undefined,
        dob: user?.profile?.dob,
        language: user?.profile?.language,
        activity: user?.profile?.preferences.activity,
        disabilities: { ...user?.profile?.preferences.disabilities },
        interests: user?.profile?.preferences.interests,
      }
    } as GenerateOptions;
  }, [params, user?.profile]);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    cancelledRef.current = false;
    // timing removed in production
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
          { id: 'wd-1', title: (lang==='ro'?'Plan simplu':'Simple plan'), steps: [], mode: 'foot', km: 0, min: 60 }
        ];
        setPlans(fallback);
      }
    }, 5000);

    try {
      const currentUserLang = user?.profile?.language || 'ro';
      const currentOptions = options;

      setCurrentStep(currentUserLang === 'ro' ? "Analizez locația..." : "Analyzing location...");
      setGenerationProgress(20);
      await new Promise(resolve => setTimeout(resolve, 150));

      setCurrentStep(currentUserLang === 'ro' ? "Generez planuri..." : "Generating plans...");

      // Generate
      const startGen = Date.now();
      const resRaw = await generatePlans(currentOptions, sig);
      const genMs = Date.now() - startGen;
      // Move progress to 85% only after generation step completes or aborts
      setGenerationProgress(85);
      if (cancelledRef.current) return;
      if (requestKeyRef.current !== normalizedLink) return;

      // Shuffle step
      const res = (params.shuffle === '1' && seed != null) ? seededShuffle(resRaw, seed) : resRaw;

      setCurrentStep(currentUserLang === 'ro' ? "Finalizez..." : "Finalizing...");
      setGenerationProgress(100);

      // Finalize step
      setPlans(res);

      // Success toast
      setToastMessage(currentUserLang === 'ro' ? '🎉 Planuri generate cu succes!' : '🎉 Plans generated successfully!');
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);

    } catch (e: any) {
      if (!cancelledRef.current) {
        const currentUserLang = user?.profile?.language || 'ro';
        setError(e?.message || (currentUserLang === 'ro' ? "Nu am putut genera planurile" : "Failed to generate plans"));
        setToastMessage(currentUserLang === 'ro' ? `❌ Eroare: ${e?.message || 'Nu am putut genera planurile'}` : `❌ Error: ${e?.message || 'Failed to generate plans'}`);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
      }
    } finally {
      clearTimeout(guard);
      console.timeEnd('[Results] total');
      setLoading(false);
      setCurrentStep("");
      inFlight.current = false;
    }
  }, [options, params.shuffle, seed, user?.profile?.language, lang]);

  useEffect(() => {
    if (inFlight.current) return;
    if (requestKeyRef.current === normalizedLink) return;
    const task = InteractionManager.runAfterInteractions(() => {
      load();
    });
    return () => { (task as any)?.cancel?.(); };
  }, [normalizedLink]);

  // Debug panel content
  const DebugPanel = () => !debugVisible ? null : (
    <View style={{ position: 'absolute', bottom: 8, left: 16, right: 16, backgroundColor: '#111827', padding: 12, borderRadius: 8 }}>
      <Text style={{ color: '#93c5fd', fontWeight: '700', marginBottom: 6 }}>Debug</Text>
      <Text style={{ color: '#f9fafb', fontSize: 12 }}>Params: {JSON.stringify(params)}</Text>
      {params.shuffle === '1' && <Text style={{ color: '#f9fafb', fontSize: 12 }}>Seed: {String(seed ?? '')}</Text>}
      <Text style={{ color: '#d1d5db', fontSize: 12 }}>Link: {normalizedLink}</Text>
    </View>
  );

  // Banner when fallbacks were applied
  const FallbackBanner = () => !showFallbackBanner ? null : (
    <View style={{ position: 'absolute', top: 8, left: 16, right: 16, backgroundColor: '#fff7ed', borderColor: '#fdba74', borderWidth: 1, padding: 8, borderRadius: 8 }}>
      <Text style={{ color: '#9a3412', fontSize: 12 }}>Some parameters were invalid or missing. Using safe defaults.</Text>
    </View>
  );

  const Card = ({ children, panHandlers }: { children: React.ReactNode; panHandlers?: any }) => (
    <View
      {...(panHandlers || {})}
      style={{ backgroundColor: "#fff", borderColor: "#e5e7eb", borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16, ...(Platform.OS === "android" ? { elevation: 1 } : {}) }}
    >
      {children}
    </View>
  );

  if (loading) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <FallbackBanner />
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          {t(lang,'plansFor')}{formatHM(options.duration)}
        </Text>

        {/* Motivational Message */}
        <View style={{
          backgroundColor: '#e3f2fd',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#2196f3'
        }}>
          <Text style={{ fontSize: 14, color: '#1565c0', fontWeight: '600' }}>
            ✨ {lang === 'ro' ? 'Planuri personalizate pentru tine!' : 'Personalized plans for you!'}
          </Text>
          <Text style={{ fontSize: 12, color: '#1976d2', marginTop: 4 }}>
            {lang === 'ro'
              ? 'Bazate pe vreme, locația ta și preferințele tale'
              : 'Based on weather, your location and preferences'
            }
          </Text>
        </View>

        {/* Enhanced Loading UI with Progress */}
        <View style={{ alignItems: "center", marginTop: 20, marginBottom: 20 }}>
          {/* Enhanced Progress Circle */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#f8f9fa',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            borderWidth: 4,
            borderColor: '#e9ecef',
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#007AFF' }}>
              {generationProgress}%
            </Text>
          </View>

          {/* Current Step with Loading Dots */}
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
              {currentStep || (lang === 'ro' ? 'Generez planuri...' : 'Generating plans...')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#007AFF', marginHorizontal: 2 }} />
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#007AFF', marginHorizontal: 2, opacity: 0.7 }} />
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#007AFF', marginHorizontal: 2, opacity: 0.4 }} />
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{
            width: '80%',
            height: 6,
            backgroundColor: '#e9ecef',
            borderRadius: 3,
            marginBottom: 16,
            overflow: 'hidden'
          }}>
            <View style={{
              width: `${generationProgress}%`,
              height: '100%',
              backgroundColor: '#007AFF',
              borderRadius: 3,
            }} />
          </View>

          <Text style={{ fontSize: 14, color: "#666", textAlign: "center", paddingHorizontal: 20 }}>
            {lang === 'ro' ? 'Creez planuri personalizate pentru tine...' : 'Creating personalized plans for you...'}
          </Text>
        </View>

        {/* Skeleton Cards */}
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <View style={{ width: 120, height: 18, backgroundColor: "#e5e7eb", borderRadius: 6 }} />
            <View style={{ marginTop: 8, width: "80%", height: 14, backgroundColor: "#f1f5f9", borderRadius: 6 }} />
            <View style={{ marginTop: 6, width: "60%", height: 14, backgroundColor: "#f1f5f9", borderRadius: 6 }} />
            <View style={{ marginTop: 6, width: "70%", height: 14, backgroundColor: "#f1f5f9", borderRadius: 6 }} />
          </Card>
        ))}
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 16 }}>
        <Text style={{ textAlign: "center" }}>{error}</Text>
        <Pressable onPress={load} style={{ backgroundColor: "#2563eb", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>{t(lang,'retry')}</Text>
        </Pressable>
      </View>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 16 }}>
        <Text style={{ textAlign: "center" }}>{t(lang,'noPlans')}</Text>
        <Pressable onPress={load} style={{ backgroundColor: "#2563eb", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>{t(lang,'retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const stopsPreview = (p: Plan) => {
    const names = p.stops?.map((s) => s.name) ?? (p.steps || []).filter((s: any) => (s as any).kind === "poi").map((s: any) => (s as any).name);
    return (names || []).slice(0, 3).join(" \u2192 ");
  };

  const metaUnits = (p: Plan) => {
    const distKm = typeof p.km === 'number' ? p.km : undefined;
    const dist = distKm == null ? '-' : (units === 'imperial' ? `${Math.round(distKm*0.621371*10)/10} mi` : `${distKm} km`);
    const min = p.min == null ? '-' : `${p.min}`;
    const cost = typeof p.cost === 'number' ? `${p.cost} lei` : '0 lei';
    return  `~${min} min | ${dist} | ${cost}`;
  };

  const getPlanTheme = (planId: string) => {
    switch(planId) {
      case 'A': return {
        emoji: '⚖️',
        title: userLang === 'ro' ? 'Echilibrat' : 'Balanced',
        color: '#007AFF',
        description: userLang === 'ro' ? 'Mix perfect de activități' : 'Perfect mix of activities'
      };
      case 'B': return {
        emoji: '🎉',
        title: userLang === 'ro' ? 'Social' : 'Social',
        color: '#FF6B35',
        description: userLang === 'ro' ? 'Distracție și socializare' : 'Fun and socializing'
      };
      case 'C': return {
        emoji: '🎨',
        title: userLang === 'ro' ? 'Cultural' : 'Cultural',
        color: '#28A745',
        description: userLang === 'ro' ? 'Cultură și natură' : 'Culture and nature'
      };
      default: return {
        emoji: '📍',
        title: planId,
        color: '#6C757D',
        description: userLang === 'ro' ? 'Plan personalizat' : 'Custom plan'
      };
    }
  };

  const getTransportIcon = (mode: string) => {
    switch(mode) {
      case 'driving': return '🚗';
      case 'bike': return '🚲';
      case 'foot': return '🚶';
      default: return '📍';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Pressable onLongPress={() => setDebugVisible(v => !v)}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
          {t(lang,'plansFor')}{formatHM(options.duration)}
        </Text>
      </Pressable>
      <FallbackBanner />
      {timeoutBanner && (
        <View style={{ position: 'absolute', top: 44, left: 16, right: 16, backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, padding: 10, borderRadius: 8 }}>
          <Text style={{ color: '#7f1d1d', fontSize: 12, marginBottom: 6 }}>
            {lang==='ro' ? 'Rețea lentă — am folosit un fallback local.' : 'Slow network — used local fallback.'}
          </Text>
          <Pressable onPress={load} style={{ alignSelf: 'flex-start', backgroundColor: '#991b1b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{t(lang,'retry')}</Text>
          </Pressable>
        </View>
      )}


      {plans.map((p, idx) => {
        // Swipe-to-shuffle dezactivat pentru a respecta regula: o singur3 rulare / set parametri
        const isFav = favs.keys.has(keyForPlan(p));
        const theme = getPlanTheme(String(p.id) || String.fromCharCode(65 + (idx % 3)));

        return (
          <Card key={String(p.id ?? idx)}>
            {/* Enhanced Header with Theme */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                backgroundColor: theme.color + '20',
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Text style={{ fontSize: 20 }}>{theme.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#0f172a", fontSize: 19, fontWeight: "700" }}>
                  {theme.title}
                </Text>
                <Text style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
                  {theme.description}
                </Text>
              </View>
              <Text style={{ fontSize: 18, marginLeft: 8 }}>
                {getTransportIcon(p.mode || 'foot')}
              </Text>
            </View>

            {/* Transit Info */}
            {(() => {
              const stepsAny = (p.steps || []) as any[];
              const ft = stepsAny.find((s: any) => s.kind === 'transit' && s.transitAction === 'board');
              if (!ft) return null;
              const badge = ft.transit === 'metro' ? 'M' : 'B';
              const name = ft.name || (ft.transit === 'metro' ? 'Stație metrou' : 'Stație bus');
              return (
                <View style={{
                  backgroundColor: '#0ea5e9' + '15',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  marginBottom: 8,
                  alignSelf: 'flex-start'
                }}>
                  <Text style={{ color: "#0ea5e9", fontWeight: '600', fontSize: 12 }}>
                    {`${badge} ${name}`}
                  </Text>
                </View>
              );
            })()}

            {/* Stops Preview */}
            <Text style={{ color: "#475569", marginBottom: 8, lineHeight: 20 }} numberOfLines={2} ellipsizeMode="tail">
              {stopsPreview(p)}
            </Text>

            {/* Enhanced Meta Information */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              backgroundColor: '#f8f9fa',
              padding: 12,
              borderRadius: 8,
              marginVertical: 8
            }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#6c757d', marginBottom: 2 }}>
                  {lang === 'ro' ? 'Timp' : 'Time'}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529' }}>
                  ⏱️ {p.min || '-'} min
                </Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
      <DebugPanel />

                <Text style={{ fontSize: 12, color: '#6c757d', marginBottom: 2 }}>
                  {lang === 'ro' ? 'Distanță' : 'Distance'}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529' }}>
                  📍 {typeof p.km === 'number' ? `${p.km} km` : '-'}
                </Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#6c757d', marginBottom: 2 }}>
                  {lang === 'ro' ? 'Cost' : 'Cost'}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529' }}>
                  💰 {typeof p.cost === 'number' ? `${p.cost} lei` : '0 lei'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", marginTop: 8, alignItems: 'center' }}>
              <Link href={{ pathname: "/plan/[id]", params: { id: String(p.id ?? idx), payload: JSON.stringify(p) } }} asChild>
                <Pressable
                  android_ripple={{ color: "#dbeafe" }}
                  style={{
                    backgroundColor: theme.color,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 12,
                    marginRight: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", marginRight: 6 }}>
                    {lang === 'ro' ? 'Vezi pe hartă' : 'View on map'}
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 16 }}>🗺️</Text>
                </Pressable>
              </Link>

              <Pressable onPress={() => favs.toggle(p)} accessibilityLabel={isFav ? 'Remove favorite' : 'Add favorite'} style={{ borderWidth: 1, borderColor: isFav ? '#ef4444' : '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginRight: 8 }}>
                <Ionicons name={isFav ? (Platform.OS === 'ios' ? 'heart.fill' : 'heart') as any : (Platform.OS === 'ios' ? 'heart' : 'heart-outline') as any} size={18} color={isFav ? '#ef4444' : '#111'} />
              </Pressable>

              <Pressable onPress={() => Share.share({ message: `${p.title || 'Plan'}\n${stopsPreview(p)}\n${metaUnits(p)}` }).catch(()=>{})} accessibilityLabel="Share plan" style={{ borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 }}>
                <Text style={{ color: '#111', fontWeight: '700' }}>Share</Text>
              </Pressable>
            </View>
          </Card>
        );
      })}

    </ScrollView>

    {/* Simple Toast */}
    {toastVisible && (
      <View style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        backgroundColor: '#10B981',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
      }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 }}>
          {toastMessage}
        </Text>
      </View>
    )}

    </SafeAreaView>
  );
}

