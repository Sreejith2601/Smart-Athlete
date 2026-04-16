import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="athlete" options={{ gestureEnabled: false }} />
      <Stack.Screen name="coach" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
