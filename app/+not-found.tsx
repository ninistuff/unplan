// app/+not-found.tsx
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function NotFound() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 16,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Oops!</Text>
      <Text style={{ textAlign: "center" }}>Ecranul nu există.</Text>

      <Link href={{ pathname: "/" }} asChild>
        <Pressable
          style={{
            backgroundColor: "#22c55e",
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Mergi la Home</Text>
        </Pressable>
      </Link>
    </View>
  );
}
