import { Tabs, Slot } from "expo-router";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from "react-native";
import WebLayout from "../../components/WebLayout";

export default function AthleteLayout() {
  if (Platform.OS === "web") {
    return (
      <WebLayout role="athlete">
        <Slot />
      </WebLayout>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFF5F5', // Match app background
          borderTopColor: '#FFE4E1', // Soft pink border
          height: 65,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#FF6B6B', // Use app primary pink for active
        tabBarInactiveTintColor: '#94A3B8', // Muted slate for inactive
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: "Training",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="dumbbell" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      
      {/* Hidden Screens */}
      <Tabs.Screen name="daily-plan" options={{ href: null }} />
      <Tabs.Screen name="coach-chat" options={{ href: null }} />
      <Tabs.Screen name="log-cycle" options={{ href: null }} />
      <Tabs.Screen name="log-session" options={{ href: null }} />
      <Tabs.Screen name="session-detail" options={{ href: null }} />
      <Tabs.Screen name="training-overview" options={{ href: null }} />
    </Tabs>
  );
}
