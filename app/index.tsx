// app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Link } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Easing,
    GestureResponderEvent,
    Image,
    LayoutChangeEvent,
    PanResponder,
    PanResponderGestureState,
    PanResponderInstance,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWeather } from "../hooks/useWeather";
import { useAuth } from "../lib/auth";
import { t } from "../lib/i18n";
import { useTheme } from "../lib/ThemeProvider";
import { buildWeatherMessage } from "../utils/weatherMessage";
import { Icon } from "./components/Icon";

// Header cu profil + vreme integrat în această pagină
// removed progress header bar
import { radii, shadows, spacing } from "../constants/theme";

type Transport = "walk" | "public" | "car" | "bike";
type WithWho = "friends" | "pet" | "family" | "partner";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function roundToStep(n: number, step = 1) {
  return Math.round(n / step) * step;
}

function formatHM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "min" : ""}`.trim() : `${m}min`;
}

type SliderProps = {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  markers?: Array<{ value: number; label: string }>;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onChangeEnd?: (v: number) => void;
  setParentScrollEnabled?: (enabled: boolean) => void; // NEW
  theme: any;
};

function Slider({min, max, step = 1, value, onChange, disabled, markers, onDragStart, onDragEnd, onChangeEnd, setParentScrollEnabled, theme
}: SliderProps) {
  // width = inner track width (excluding horizontal padding)
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const trackRef = useRef<View>(null);
  // pos = left-of-thumb translation in [0..movable]
  const pos = useRef(new Animated.Value(0)).current;
  const lastVal = useRef<number>(value);
  // startX stores starting pos (in px, left-of-thumb), for dx math
  const startX = useRef(0);

  const thumbSize = 24;
  const PADDING = 12; // must match track paddingHorizontal

  // pos = thumb CENTER relative to inner-left of track (after padding)

  // value -> normalized pos in [0..movable]
  const valueToPos = (val: number, w: number) => {
    const inner = Math.max(w, 1);
    const r = clamp((val - min) / Math.max(max - min, 1), 0, 1);
    return r * inner;
  };
  // pos -> value
  const posToValue = (p: number, w: number) => {
    const inner = Math.max(w, 1);
    const r = inner > 0 ? clamp(p / inner, 0, 1) : 0;
    return min + r * (max - min);
  };

  // snap to nearest step offset from min
  const snapToStep = (v: number) => Math.round((v - min) / (step || 1)) * (step || 1) + min;

  // keep thumb synced when external value changes
  useEffect(() => {
    widthRef.current = width;
    const p = valueToPos(value, widthRef.current);
    Animated.timing(pos, {
      toValue: p,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    lastVal.current = value;
  }, [width, value, pos]);

  // layout on track: measure inner width (minus padding)
  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = Math.max(0, e.nativeEvent.layout.width);
    if (w > 0) {
      widthRef.current = w;
      setWidth(w);
    }
  };

  // rAF fallback measure to ensure width > 1 after mount
  useEffect(() => {
    if (width > 1) return;
    const id = requestAnimationFrame(() => {
      // measure returns width of the track
      trackRef.current?.measure?.((_x: number, _y: number, w: number) => {
        const mw = Math.max(0, w ?? 0);
        if (mw > 1) {
          widthRef.current = mw;
          setWidth(mw);
        }
      });
    });
    return () => cancelAnimationFrame(id);
  }, [width]);

  // drag helpers
  const beginDragAt = (trackX: number) => {
    // convert x on track to THUMB CENTER pos
    const inner = Math.max(widthRef.current, 1);
    const localCenter = trackX;
    const clamped = clamp(localCenter, 0, inner);
    pos.setValue(clamped);
    const val = clamp(snapToStep(posToValue(clamped, widthRef.current)), min, max);
    lastVal.current = val;
    onChange(val);
    startX.current = clamped;
    onDragStart && onDragStart();
  };

  const moveDragBy = (dx: number) => {
    const inner = Math.max(widthRef.current, 1);
    const nx = clamp(startX.current + dx, 0, inner);
    pos.setValue(nx);
    const val = clamp(snapToStep(posToValue(nx, widthRef.current)), min, max);
    if (val !== lastVal.current) {
      lastVal.current = val;
      onChange(val);
    }
  };

  const endDrag = () => {
    pos.stopAnimation((v) => {
      const cur = typeof v === "number" ? v : 0;
      const snappedVal = clamp(snapToStep(posToValue(cur, widthRef.current)), min, max);
      Animated.timing(pos, {
        toValue: valueToPos(snappedVal, widthRef.current),
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(() => onChangeEnd && onChangeEnd(snappedVal));
    });
    onDragEnd && onDragEnd();
  };

  // fill up to THUMB CENTER (under the thumb)
  const fillWidth = useMemo(() => pos, [pos]);

  // Pan pe THUMB
  const pan: PanResponderInstance = useRef(
    PanResponder.create({
      // dÄƒm drumul la gest imediat; fÄƒrÄƒ prag pe dx
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: () => {
        setParentScrollEnabled?.(false);
        pos.stopAnimation((cur) => { startX.current = (cur as number) ?? 0; });
        onDragStart && onDragStart();
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gs: PanResponderGestureState) => {
        if (disabled) return;
        moveDragBy(gs.dx);
      },
      onPanResponderRelease: () => { endDrag(); setParentScrollEnabled?.(true); },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => { endDrag(); setParentScrollEnabled?.(true); },
    })
  ).current;

  // Pan pe TRACK (press & hold oriunde pe barÄƒ)
  const trackPan: PanResponderInstance = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        // x relativ la track â€” include padding
        setParentScrollEnabled?.(false);
        const px = e.nativeEvent.locationX;
        beginDragAt(px);
      },
      onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => { moveDragBy(g.dx); },
      onPanResponderRelease: () => { endDrag(); setParentScrollEnabled?.(true); },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => { endDrag(); setParentScrollEnabled?.(true); },
    })
  ).current;

  return (
    <View pointerEvents="box-none" style={{ position: "relative", width: "100%", paddingVertical: 8 }}>
      {/* TRACK â€” trebuie sÄƒ fie View (nu Pressable) */}
      <View
        ref={trackRef}
        {...trackPan.panHandlers}
        pointerEvents="box-only"
        onLayout={onTrackLayout}
        style={{
          height: 12,
          backgroundColor: theme.colors.border,
          borderRadius: 9999,
          // no padding: fill should reach the ends at max
        }}
      >
        {/* FILL (up to thumb right edge) */}
        <Animated.View
          pointerEvents="none"
          style={{
            width: fillWidth,
            height: 8,
            backgroundColor: disabled ? theme.colors.textSecondary : theme.colors.accent,
            borderRadius: 9999,
          }}
        />
      </View>

      {/* THUMB */}
      <Animated.View
        {...pan.panHandlers}
        pointerEvents="box-only"
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        style={{
          position: "absolute",
          left: -thumbSize / 2,
          transform: [{ translateX: pos }],
          top: 8 / 2 - thumbSize / 2 + 8,
          width: thumbSize,
          height: thumbSize,
          borderRadius: thumbSize / 2,
          backgroundColor: theme.colors.background,
          borderWidth: 2,
          borderColor: disabled ? theme.colors.textSecondary : theme.colors.accent,
          elevation: 2,
          zIndex: 20,
        }}
      />

      {/* markers disabled for now */}
    </View>
  );
}

function Chip({ label, active, onPress, disabled, theme }: { label: string; active?: boolean; onPress?: () => void; disabled?: boolean; theme: any }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.round,
        backgroundColor: active ? theme.colors.accent : theme.colors.surface,
        borderWidth: 1,
        borderColor: active ? theme.colors.accent : theme.colors.borderSoft,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color: active ? "#fff" : theme.colors.text, fontWeight: "600", fontSize: theme.textSizes.sm }}>{label}</Text>
    </Pressable>
  );
}

function OptionCard({ title, icon, active, onPress, theme }: { title: string; icon: string; active?: boolean; onPress?: () => void; theme: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: "48%",
        marginHorizontal: "1%",
        marginBottom: spacing.sm,
        padding: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: active ? theme.colors.accent : theme.colors.borderSoft,
        ...(Platform.OS === 'android' ? { elevation: 2 } : { ...shadows.xs }),
      }}
    >
      <Text style={{ fontSize: 24, marginBottom: 6 }}>{icon}</Text>
      <Text style={{ fontSize: theme.textSizes.sm, fontWeight: "700", color: theme.colors.text }}>{title}</Text>
    </Pressable>
  );
}

function CompactButton({ iconName, active, onPress, theme }: { iconName: any; active?: boolean; onPress?: () => void; theme: any }) {
  const size = 68;
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size/2,
        backgroundColor: active ? theme.colors.accent : theme.colors.surface,
        borderWidth: 2,
        borderColor: active ? theme.colors.accent : theme.colors.borderSoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
        ...(Platform.OS === 'android' ? { elevation: 2 } : { ...shadows.xs }),
      }}
    >
      <Icon name={iconName} size={28} color={active ? '#fff' : theme.colors.text} />
    </Pressable>
  );
}

// Folosim Ionicons ca fallback până adăugăm setul nostru de SVG/PNG custom
const transportOptions: Array<{ key: Transport; title: string; iconName: any }> = [
  { key: "walk",   title: "Pe jos",            iconName: "walk-outline" },
  { key: "public", title: "Transport public",  iconName: "bus-outline" },
  { key: "car",    title: "Mașina",            iconName: "car-outline" },
  { key: "bike",   title: "Bicicletă",         iconName: "bicycle-outline" },
];

const withOptions: Array<{ key: WithWho; title: string; iconName: any }> = [
  { key: "friends",  title: "Cu prietenii", iconName: "people-outline" },
  { key: "family",   title: "Cu familia",   iconName: "family-custom" },
  { key: "partner",  title: "Partenerul/a", iconName: "date-custom" },
  { key: "pet",      title: "Animalul",     iconName: "paw-outline" },
];

export default function Home() {
  const { theme } = useTheme();
  const weather = useWeather();
  const hour = new Date().getHours();
  const weekday = new Date().getDay();
  const { user, updateProfile } = useAuth();
  const lang = (user?.profile?.language ?? 'ro') as 'en' | 'ro';
  const insets = useSafeAreaInsets();

  const onPickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        const uri = res.assets[0].uri;
        await updateProfile({ avatarUri: uri });
      }
    } catch {}
  };




  // State
  function HomeHeader() {
    const avatar = user?.profile?.avatarUri;
    const city = weather?.city ?? (lang==='ro' ? 'Locația ta' : 'Your location');
    const temp = weather?.temperature;

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {/* Avatar mare, tap pentru schimbare */}
        <Pressable onPress={onPickAvatar} style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: theme.colors.surface,
          borderWidth: 2,
          borderColor: theme.colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text style={{ fontSize: 28 }}>🙂</Text>
          )}
        </Pressable>

        {/* Info locație + meteo + mesaj */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="location-outline" size={16} color={theme.colors.text} />
            <Text style={{ fontWeight: '800', color: theme.colors.text }}>{city}</Text>
            {typeof temp === 'number' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="sunny-outline" size={16} color={theme.colors.text} />
                <Text style={{ color: theme.colors.text }}>{temp}°C</Text>
              </View>
            )}
          </View>
          <Text style={{ marginTop: 6, color: theme.colors.text }}>
            {weather ? buildWeatherMessage(weather.temperature, weather.condition as any, hour, weekday) : ''}
          </Text>
        </View>
      </View>
    );
  }

  const [duration, setDuration] = useState(60);
  const [transport, setTransport] = useState<Transport>("walk");
  const [budget, setBudget] = useState(200); // 0..300 (300 => âˆž)
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const setParentScrollEnabled = (enabled: boolean) => {
    // @ts-ignore RN setNativeProps
    scrollRef.current?.setNativeProps?.({ scrollEnabled: enabled });
  };

  const [withWho, setWithWho] = useState<WithWho>("friends");
  const [friendsCount, setFriendsCount] = useState(2);
  const [friendsExpat, setFriendsExpat] = useState(false);
  const [friendsDisabilities, setFriendsDisabilities] = useState(false);
  const [petType, setPetType] = useState<"dog" | "cat">("dog");
  const [familyParents, setFamilyParents] = useState(false);
  const [familyGrandparents, setFamilyGrandparents] = useState(false);
  const [familyDisabilities, setFamilyDisabilities] = useState(false);
  const [familyChild, setFamilyChild] = useState(false);
  const [childAge, setChildAge] = useState(0);

  if (!weather) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>{t(lang,'loadingWeather')}</Text>
      </View>
    );
  }

  const msg = buildWeatherMessage(
    Math.round(weather.temperature),
    weather.condition as any,
    hour,
    weekday
  );

  function buildParams() {
    const params: any = {
      d: String(duration),
      t: transport,
      w: withWho,
    };
    params.b = budget >= 300 ? "inf" : String(budget);
    params.fc = String(friendsCount);
    params.fx = friendsExpat ? "1" : "0";
    params.fd = friendsDisabilities ? "1" : "0";
    params.pt = petType;
    params.fp = familyParents ? "1" : "0";
    params.fg = familyGrandparents ? "1" : "0";
    params.fa = familyDisabilities ? "1" : "0";
    params.ca = String(childAge || 0);
    return params;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        ref={scrollRef}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}
      >
        {/* Header cu avatar + locație + meteo */}
        <HomeHeader />

        {/* Timp */}
        <View style={{ paddingHorizontal: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, paddingLeft: 4 }}>
            <Text style={{ fontSize: theme.textSizes.lg, fontWeight: "800", color: theme.colors.text }}>{lang==='ro' ? 'cât timp?' : t(lang,'home_time')}</Text>
            <Text style={{ fontSize: theme.textSizes.base, fontWeight: "700", color: theme.colors.text }}>{formatHM(duration)}</Text>
          </View>
          <Slider
            min={30}
            max={720}
            step={15}
            value={duration}
            onChange={setDuration}
            setParentScrollEnabled={setParentScrollEnabled}
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
            theme={theme}
          />
        </View>

        {/* Transport */}
        <View style={{ paddingHorizontal: 4, marginTop: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <Text style={{ fontSize: theme.textSizes.lg, fontWeight: '800', color: theme.colors.text }}>{lang==='ro' ? 'cu ce mergi?' : t(lang,'home_transport')}</Text>
            {lang==='ro' && (
              <Text style={{ color: theme.colors.textSecondary, fontSize: theme.textSizes.sm }}>
                {transport === 'public' ? 'transport public' : transport === 'car' ? 'mașina' : transport === 'bike' ? 'bicicleta' : 'pe jos'}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 }}>
            {transportOptions.map((opt) => (
              <CompactButton
                key={opt.key}
                iconName={opt.iconName}
                active={transport === opt.key}
                onPress={() => setTransport(opt.key)}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* Buget */}
        <View style={{ paddingHorizontal: 4, marginTop: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Text style={{ fontSize: theme.textSizes.lg, fontWeight: "800", color: theme.colors.text }}>{lang==='ro' ? 'ai bani?' : t(lang,'home_budget')}</Text>
            <Text style={{ fontSize: theme.textSizes.base, fontWeight: "700", color: theme.colors.text }}>{budget >= 300 ? "\u221E" : `${budget} lei`}</Text>
          </View>
          <Slider
            min={0}
            max={300}
            step={10}
            value={budget}
            onChange={setBudget}
            setParentScrollEnabled={setParentScrollEnabled}
            onDragStart={() => setScrollEnabled(false)}
            onDragEnd={() => setScrollEnabled(true)}
            theme={theme}
          />
        </View>

        {/* Cu cine */}
        <View style={{ paddingHorizontal: 4, marginTop: 18 }}>
          <Text style={{ fontSize: theme.textSizes.lg, fontWeight: "800", color: theme.colors.text, marginBottom: 6 }}>{lang==='ro' ? 'cu cine mergi?' : t(lang,'home_with')}</Text>
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
            {withOptions.map((opt) => (
              <CompactButton
                key={opt.key}
                iconName={opt.iconName}
                active={withWho === opt.key}
                onPress={() => setWithWho(opt.key as WithWho)}
                theme={theme}
              />
            ))}
          </View>

          {withWho === "friends" && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6 }}>{t(lang,'home_friendsCount')}</Text>
              <Slider min={1} max={10} step={1} value={friendsCount} onChange={setFriendsCount} setParentScrollEnabled={setParentScrollEnabled} theme={theme} />
              <Text style={{ fontSize: theme.textSizes.xs, color: theme.colors.text, marginTop: 4 }}>{friendsCount === 10 ? "10+" : friendsCount}</Text>
              <View style={{ flexDirection: "row", marginTop: 8 }}>
                <Chip label={t(lang,'home_expat')} active={friendsExpat} onPress={() => setFriendsExpat(!friendsExpat)} theme={theme} />
                <Chip label={t(lang,'home_disabilities')} active={friendsDisabilities} onPress={() => setFriendsDisabilities(!friendsDisabilities)} theme={theme} />
              </View>
            </View>
          )}

          {withWho === "pet" && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6 }}>{t(lang,'home_pet')}</Text>
              <View style={{ flexDirection: "row" }}>
                <Chip label={t(lang,'home_dog')} active={petType === "dog"} onPress={() => setPetType("dog")} theme={theme} />
                <Chip label={t(lang,'home_cat')} active={petType === "cat"} onPress={() => setPetType("cat")} theme={theme} />
              </View>
            </View>
          )}

          {withWho === "family" && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6 }}>{t(lang,'home_prefs')}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <Chip label={t(lang,'home_parents')} active={familyParents} onPress={() => setFamilyParents(!familyParents)} theme={theme} />
                <Chip label={t(lang,'home_grandparents')} active={familyGrandparents} onPress={() => setFamilyGrandparents(!familyGrandparents)} theme={theme} />
                <Chip label={t(lang,'home_disabilities')} active={familyDisabilities} onPress={() => setFamilyDisabilities(!familyDisabilities)} theme={theme} />
                <Chip label={t(lang,'home_withChild')} active={familyChild} onPress={() => { const next = !familyChild; setFamilyChild(next); if (!next) setChildAge(0); }} theme={theme} />
              </View>
              {familyChild && (
                <>
                      <Text style={{ fontWeight: "600", marginTop: 12 }}>{t(lang,'home_childAge')}</Text>
                  <Slider min={0} max={17} step={1} value={childAge} onChange={setChildAge} setParentScrollEnabled={setParentScrollEnabled} theme={theme} />
                  <Text style={{ fontSize: theme.textSizes.xs, color: theme.colors.text, marginTop: 4 }}>{childAge === 0 ? t(lang,'home_noChild') : (childAge + ' ' + t(lang,'home_years'))}</Text>
                </>
              )}
            </View>
          )}

        </View>

        {/* CTA-uri */}
        <View style={{ gap: 12, paddingVertical: 12 }}>
          <Link href={{ pathname: "/results", params: buildParams() }} asChild>
            <Pressable style={{ backgroundColor: '#118E97', paddingVertical: 16, borderRadius: 28, alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: theme.textSizes.lg, letterSpacing: 2 }}>PLAN</Text>
            </Pressable>
          </Link>

          <Link href={{ pathname: "/results", params: { ...buildParams(), shuffle: "1" } }} asChild>
            <Pressable style={{ borderWidth: 1, borderColor: theme.colors.borderSoft, paddingVertical: 14, borderRadius: 28, alignItems: "center", backgroundColor: theme.colors.surface }}>
              <Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: theme.textSizes.base, letterSpacing: 2 }}>SURPRINDE-MĂ</Text>
            </Pressable>
          </Link>
        </View>

      </ScrollView>

    </View>
  );
}
