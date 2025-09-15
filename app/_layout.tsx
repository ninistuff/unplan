import { Stack } from 'expo-router';
import { AuthProvider } from "../lib/auth";
import { ThemeProvider } from "../lib/ThemeProvider";

export default function Layout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </AuthProvider>
  );
}
