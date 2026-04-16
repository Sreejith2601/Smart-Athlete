import { Stack } from "expo-router";

export default function CoachLayout() {
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
