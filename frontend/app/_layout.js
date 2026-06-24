import { Stack } from "expo-router";
import { Platform } from "react-native";

// expo-router exposes a Head component for injecting <head> tags on web
import Head from "expo-router/head";


export default function RootLayout() {
  return (
    <>
      {/* Meta tags — only rendered on web */}
      {Platform.OS === "web" && (
        <Head>
          <title>Smart Athlete — AI-Powered Training Platform</title>
          <meta name="description" content="Smart Athlete is an AI-powered athlete management platform for tracking training, performance analytics, and coach-athlete collaboration." />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta name="theme-color" content="#FF6B6B" />
          <meta property="og:title" content="Smart Athlete" />
          <meta property="og:description" content="AI-Powered Training & Performance Platform" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <style>{`
            /* Web-only global resets */
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 0;
              background-color: #FFF5F5;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            /* Smooth scrollbar on web */
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
            /* Remove blue highlight on tap (mobile web) */
            * { -webkit-tap-highlight-color: transparent; }
          `}</style>
        </Head>
      )}

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="role-selection" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="athlete"
          options={{ gestureEnabled: Platform.OS !== "web" }}
        />
        <Stack.Screen
          name="coach"
          options={{ gestureEnabled: Platform.OS !== "web" }}
        />
      </Stack>
    </>
  );
}
