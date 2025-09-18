import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
      <Text>Home</Text>
      <Button title="Mergi la Results" onPress={() => router.push("/results")} />
    </View>
  );
}
