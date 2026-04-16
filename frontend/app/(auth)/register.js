import { View, Text, TextInput, Pressable, StyleSheet, Image, ScrollView, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { setCurrentUser } from "../../utils/storage";
import { registerUser } from "../../services/api";

export default function RegisterScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!name.trim()) {
      alert("Enter your name");
      return;
    }

    if (!isValidEmail(email)) {
      alert("Enter valid email");
      return;
    }

    if (password.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }

    const user = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role,
      onboardingCompleted: role === "coach", // coaches skip onboarding
      profile: {},
    };

    await setCurrentUser(user);

    // Role-based navigation
    if (role === "coach") {
      // --- Backend Registration for Coach ---
      const backendUserData = {
        name,
        email,
        password,
        role: "coach",
      };

      console.log("[Register] Coach backend registration data:", JSON.stringify(backendUserData, null, 2));

      try {
        const backendResponse = await registerUser(backendUserData);
        console.log("[Register] Coach backend registration SUCCESS:", JSON.stringify(backendResponse, null, 2));
      } catch (error) {
        console.error("[Register] Coach backend registration FAILED:", error.message);
      }
      // --- End Backend Registration for Coach ---

      router.replace("/coach/home");
    } else {
      router.replace({
        pathname: "/onboarding/athlete-step1",
        params: { name, email, password, role },
      });
    }
  };

  return (
    <LinearGradient
      colors={["#FFF5F5", "#FFE4E1", "#FFF5F5"]}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Glow shapes */}
          <View style={styles.glowGreen} />
          <View style={styles.glowCyan} />

      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Pressable style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </Pressable>
      </View>
      </ScrollView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingBottom: 40,
  },

  glowGreen: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 200,
    backgroundColor: "#FF6B6B",
    top: 80,
    right: -40,
    opacity: 0.15,
  },

  glowCyan: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 200,
    backgroundColor: "#38BDF8",
    bottom: 100,
    left: -40,
    opacity: 0.15,
  },

  logo: {
    width: 90,
    height: 90,
    marginBottom: 20,
  },

  card: {
    width: "100%",
    padding: 24,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  button: {
    backgroundColor: "#FF6B6B",
    padding: 16,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },
});
