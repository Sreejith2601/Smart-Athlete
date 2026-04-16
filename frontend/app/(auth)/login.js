import { View, Text, TextInput, Pressable, StyleSheet, Image, ScrollView, TouchableWithoutFeedback, Keyboard, Modal, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setCurrentUser } from "../../utils/storage";
import { loginUser } from "../../services/api";
import { forgotPasswordApi, resetPasswordApi } from "../../services/api";

export default function LoginScreen() {
  const router = useRouter();
  const { role = "athlete" } = useLocalSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Forgot Password State (New) ──────────────────────────────────────────
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpStep, setFpStep] = useState(1); // 1 = enter email, 2 = enter code + new pw
  const [fpEmail, setFpEmail] = useState("");
  const [fpCode, setFpCode] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  // ────────────────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    console.log("[Login] Attempting login with:", { email, role });

    try {
      // 1. Call backend login API
      const response = await loginUser({ email, password });

      console.log("[Login] Backend response:", JSON.stringify(response, null, 2));

      if (!response || !response.token) {
        alert("Login failed. Please check your credentials.");
        return;
      }

      // 2. Store token AND userId in AsyncStorage
      await AsyncStorage.setItem("token", response.token);
      await AsyncStorage.setItem("userId", response.userId);
      console.log("[Login] Token stored in AsyncStorage");
      console.log("[Login] userId stored in AsyncStorage:", response.userId);

      // 3. Store minimal current user data locally
      const minimalUser = {
        id: response.userId,
        email,
        role: response.role,
        token: response.token,
        trainingMode: response.trainingMode,
      };
      await setCurrentUser(minimalUser);
      console.log("[Login] Local user set:", minimalUser.email);

      // 4. Navigate based on role from backend response
      const userRole = response.role;
      console.log("[Login] Navigating with role:", userRole);

      if (userRole === "coach") {
        router.replace("/coach/home");
      } else if (userRole === "athlete") {
        router.replace("/athlete/home");
      } else {
        alert("Role not supported yet");
      }
    } catch (error) {
      console.error("[Login] Login error:", error.message);
      alert(error.message || "Login failed. Please try again.");
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
          {/* Glow circles */}
          <View style={styles.glowGreen} />
          <View style={styles.glowCyan} />

      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.card}>
        <Text style={styles.title}>Sign In</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/register",
              params: { role },
            })
          }
        >
          <Text style={styles.registerText}>
            Don't have an account? Register
          </Text>
        </Pressable>

        {/* ── Forgot Password Link (New) ── */}
        <Pressable
          onPress={() => {
            setFpStep(1);
            setFpEmail("");
            setFpCode("");
            setFpNewPassword("");
            setShowForgotModal(true);
          }}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </Pressable>
        </View>

        {/* ── Forgot Password Modal (New) ── */}
        <Modal
          visible={showForgotModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowForgotModal(false)}
        >
          <View style={styles.fpOverlay}>
            <View style={styles.fpModal}>
              {/* Header */}
              <View style={styles.fpHeader}>
                <Text style={styles.fpTitle}>
                  {fpStep === 1 ? "Forgot Password" : "Enter Reset Code"}
                </Text>
                <Pressable onPress={() => setShowForgotModal(false)}>
                  <Text style={styles.fpClose}>✕</Text>
                </Pressable>
              </View>

              {fpStep === 1 ? (
                /* Step 1 — Enter email */
                <>
                  <Text style={styles.fpSubtitle}>
                    Enter your account email. We will send a 6-digit reset code to your inbox.
                  </Text>
                  <TextInput
                    style={styles.fpInput}
                    placeholder="Email address"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={fpEmail}
                    onChangeText={setFpEmail}
                  />
                  <Pressable
                    style={[styles.fpButton, (!fpEmail || fpLoading) && { opacity: 0.5 }]}
                    disabled={!fpEmail || fpLoading}
                    onPress={async () => {
                      setFpLoading(true);
                      try {
                        await forgotPasswordApi(fpEmail.trim());
                        setFpStep(2);
                      } catch (err) {
                        Alert.alert("Error", err.message || "Something went wrong.");
                      } finally {
                        setFpLoading(false);
                      }
                    }}
                  >
                    {fpLoading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.fpButtonText}>Send Code</Text>
                    }
                  </Pressable>
                </>
              ) : (
                /* Step 2 — Enter code + new password */
                <>
                  <Text style={styles.fpSubtitle}>
                    Check your email for the 6-digit code, then set a new password.
                  </Text>
                  <TextInput
                    style={styles.fpInput}
                    placeholder="6-digit code"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={fpCode}
                    onChangeText={setFpCode}
                  />
                  <TextInput
                    style={styles.fpInput}
                    placeholder="New password (min 6 chars)"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={fpNewPassword}
                    onChangeText={setFpNewPassword}
                  />
                  <Pressable
                    style={[styles.fpButton, (!fpCode || !fpNewPassword || fpLoading) && { opacity: 0.5 }]}
                    disabled={!fpCode || !fpNewPassword || fpLoading}
                    onPress={async () => {
                      setFpLoading(true);
                      try {
                        await resetPasswordApi(fpEmail.trim(), fpCode.trim(), fpNewPassword);
                        Alert.alert("Success", "Password reset! You can now log in.");
                        setShowForgotModal(false);
                      } catch (err) {
                        Alert.alert("Error", err.message || "Invalid or expired code.");
                      } finally {
                        setFpLoading(false);
                      }
                    }}
                  >
                    {fpLoading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.fpButtonText}>Reset Password</Text>
                    }
                  </Pressable>
                  <Pressable onPress={() => setFpStep(1)} style={{ marginTop: 12, alignSelf: "center" }}>
                    <Text style={{ color: "#94A3B8", fontSize: 13 }}>← Back</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>

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

  /* Glow shapes */
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
    fontSize: 16,
    textAlign: "center",
    fontWeight: "800",
  },

  registerText: {
    marginTop: 20,
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  // ── Forgot Password styles (New) ──────────────────────────────────────────
  forgotText: {
    marginTop: 12,
    textAlign: "center",
    color: "#FF6B6B",
    fontSize: 13,
    fontWeight: "700",
  },

  fpOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  fpModal: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },

  fpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  fpTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },

  fpClose: {
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "600",
    paddingHorizontal: 4,
  },

  fpSubtitle: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },

  fpInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  fpButton: {
    backgroundColor: "#FF6B6B",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  fpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  // ────────────────────────────────────────────────────────────────────────
});
