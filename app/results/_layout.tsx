// app/results/_layout.tsx
import { Stack } from "expo-router";

export default function ResultsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Results",
        }}
      />
      <Stack.Screen
        name="filters"
        options={{
          title: "Filters",
          presentation: "modal",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="map"
        options={{
          title: "Map View",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
