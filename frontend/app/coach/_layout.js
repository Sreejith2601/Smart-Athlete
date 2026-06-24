import { Stack, Slot } from "expo-router";
import { Platform } from "react-native";
import WebLayout from "../../components/WebLayout";

export default function CoachLayout() {
  if (Platform.OS === "web") {
    return (
      <WebLayout role="coach">
        <Slot />
      </WebLayout>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="create-plan" />
      <Stack.Screen name="athlete-detail" />
      <Stack.Screen name="athlete-history" />
      <Stack.Screen name="athlete-chat" />
      <Stack.Screen name="workload" />
      <Stack.Screen name="workload-detail" />
    </Stack>
  );
}
