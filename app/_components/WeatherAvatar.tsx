// app/components/WeatherAvatar.tsx
import LottieView from "lottie-react-native";
import { View } from "react-native";

type Condition = "sunny" | "cloudy" | "rainy";

type Props = {
  tempC?: number;
  condition?: Condition;
  size?: number;
};

export default function WeatherAvatar({ condition = "sunny", tempC, size = 56 }: Props) {
  let source: any;

  try {
    if (condition === "rainy") {
      source = require("../../assets/lottie/rainy.json");
    } else if (typeof tempC === "number" && tempC < 10) {
      source = require("../../assets/lottie/cold.json");
    } else if (typeof tempC === "number" && tempC >= 28) {
      source = require("../../assets/lottie/hot.json");
    } else if (condition === "cloudy") {
      source = require("../../assets/lottie/cloudy.json");
    } else {
      source = require("../../assets/lottie/sunny.json");
    }
  } catch {
    // fallback safe circle if assets are missing
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#ccc",
        }}
      />
    );
  }

  return (
    <LottieView source={source} autoPlay loop style={{ width: size, height: size }} />
  );
}

