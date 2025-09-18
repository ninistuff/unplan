// app/plan/[id].tsx
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useRef } from "react";
import { Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useAuth } from "../../lib/auth";
import type { Plan } from "../../lib/planTypes";
import { MAP_HTML } from "../../web/mapHtml";

export default function PlanDetails() {
  const params = useLocalSearchParams<{ id: string; payload: string }>();
  const { user } = useAuth();
  const plan: Plan | null = useMemo(() => {
    try {
      return JSON.parse(params.payload as string);
    } catch {
      return null;
    }
  }, [params.payload]);

  const webRef = useRef<WebView>(null);

  if (!plan) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Plan invalid.</Text>
      </View>
    );
  }

  const points = plan.steps.map((s) => ({
    name: s.kind === "start" ? "Start" : s.name,
    lat: s.coord.lat,
    lon: s.coord.lon,
    kind: (s as any).kind,
    transit: (s as any).kind === "transit" ? (s as any).transit : undefined,
    transitAction: (s as any).kind === "transit" ? (s as any).transitAction : undefined,
    stopId: (s as any).kind === "transit" ? (s as any).stopId : undefined,
    imageUrl: (s as any).coord?.imageUrl || undefined,
  }));
  const payload = {
    points,
    mode: plan.mode,
    segments: plan.routeSegments || [],
    userAvatar: user?.profile?.avatarUri,
  };
  const payloadJS = JSON.stringify(payload);

  console.log("[PlanDetails] Payload for map:", payload);

  const onWebViewLoad = () => {
    console.log("[PlanDetails] WebView loaded, waiting for map initialization");
    // Add delay to ensure map is fully loaded
    setTimeout(() => {
      console.log("[PlanDetails] Injecting renderPlan after delay");
      webRef.current?.injectJavaScript(`
        try {
          console.log('[WebView] Checking if renderPlan exists:', typeof window.renderPlan);
          if (typeof window.renderPlan === 'function') {
            console.log('[WebView] Calling renderPlan with payload');
            window.renderPlan(${payloadJS});
            console.log('[WebView] renderPlan completed successfully');
          } else {
            console.error('[WebView] renderPlan function not found');
          }
        } catch(e) {
          console.error('[WebView] renderPlan error:', e.message, e.stack);
        }
        true;
      `);
    }, 1000); // 1 second delay
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 👇 asta schimbă titlul din header */}
      <Stack.Screen options={{ title: plan.title }} />

      <View
        style={{ padding: 12, borderBottomWidth: 1, borderColor: "#333", backgroundColor: "#111" }}
      >
        <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>{plan.title}</Text>
        {plan.steps.map((s, i) => (
          <Text key={i} style={{ color: "#ccc", marginTop: 4 }}>
            {(() => {
              const idx = i + 1;
              if (s.kind === "start") return `${idx}. Start`;
              if (s.kind === "poi") return `${idx}. ${s.name} (${s.category})`;
              const tr: any = s as any;
              const nm = tr?.name || (tr?.transit === "metro" ? "Stație metrou" : "Stație bus");
              return `${idx}. ${nm}`;
            })()}
          </Text>
        ))}
      </View>

      <WebView
        key={JSON.stringify(points)}
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: MAP_HTML }}
        style={{ flex: 1 }}
        onLoad={onWebViewLoad}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("[PlanDetails] WebView error:", nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("[PlanDetails] WebView HTTP error:", nativeEvent);
        }}
        onLoadStart={() => console.log("[PlanDetails] WebView load started")}
        onLoadEnd={() => console.log("[PlanDetails] WebView load ended")}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
      />
    </View>
  );
}
