import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile, getCPIMetrics, getDailyAIPlan } from "../../services/api";

export default function DailyPlanScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [planData, setPlanData] = useState(null);

  const fetchDailyPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No session found. Please login again.");

      // 1. Get User Profile (for event and level)
      const profile = await getProfile(token);
      const event = profile.specialization || "5000m";
      const level = profile.fitnessLevel || "beginner";
      const startDate = profile.createdAt; // Using createdAt as default startDate for the 28-day cycle

      // 2. Get CPI Metrics (for ML features)
      const analytics = await getCPIMetrics(token);
      if (!analytics || !analytics.mlPayload) {
        throw new Error("Could not fetch training metrics. Ensure you have logged sessions.");
      }

      // 3. Gather Race Inputs (from profile or defaults)
      const raceDistance = profile.profile?.raceDistance || 5000;
      const raceTime = profile.profile?.raceTime || 20.0;

      // 4. Call Training Engine
      const payload = {
        event,
        level,
        startDate,
        raceTime,
        raceDistance,
        mlFeatures: analytics.mlPayload
      };

      console.log("[DailyPlan] Fetching with payload:", JSON.stringify(payload, null, 2));
      const plan = await getDailyAIPlan(token, payload);
      setPlanData(plan);

    } catch (err) {
      console.error("[DailyPlan] Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDailyPlan();
    }, [])
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "overtraining": return "#ef4444"; // red
      case "undertraining": return "#f97316"; // orange
      case "optimal": return "#22c55e"; // green
      default: return "#9ca3af";
    }
  };

  const getIntensityColor = (intensity) => {
    switch (intensity?.toLowerCase()) {
      case "easy":
      case "recovery": return "#22c55e";
      case "moderate":
      case "tempo": return "#3b82f6";
      case "interval":
      case "hard": return "#ef4444";
      default: return "#ffffff";
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#FFF5F5", "#FFE4E1"]} style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Analyzing performance...</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#FFF5F5", "#FFE4E1"]} style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDailyPlan}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FFF5F5", "#FFE4E1", "#FFF5F5"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{planData?.day || "Today's Plan"}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(planData?.mlPrediction) + "20" }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(planData?.mlPrediction) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(planData?.mlPrediction) }]}>
                AI Status: {planData?.mlPrediction?.toUpperCase() || "UNKNOWN"}
              </Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Sessions */}
        {planData?.sessions?.length > 0 ? (
          planData.sessions.map((session, index) => {
            const isRunning = (session.type || "").includes("run") || (session.type || "").includes("interval");
            const isStrength = (session.type || "").includes("strength");

            return (
              <View key={index} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeIcon}>{isRunning ? "🏃" : isStrength ? "💪" : "🔥"}</Text>
                    <Text style={styles.typeText}>{(session.type || "TRAINING").replace("_", " ").toUpperCase()}</Text>
                  </View>
                  <View style={[styles.intensityTag, { borderColor: getIntensityColor(session.intensity) }]}>
                    <Text style={[styles.intensityTagText, { color: getIntensityColor(session.intensity) }]}>
                      {session.intensity?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {session.distance && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Distance</Text>
                    <Text style={styles.metricValue}>{session.distance}</Text>
                  </View>
                )}

                {isRunning && (
                  <View style={styles.paceContainer}>
                    <Text style={styles.paceLabel}>Target Pace</Text>
                    <Text style={styles.paceValue}>{session.pace || "N/A"}</Text>
                  </View>
                )}

                <Text style={styles.description}>{session.description}</Text>

                {isStrength && session.exercises?.length > 0 && (
                  <View style={styles.exerciseContainer}>
                    <Text style={styles.exerciseTitle}>EXERCISES</Text>
                    {session.exercises.map((ex, i) => (
                      <View key={i} style={styles.exerciseRow}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        <Text style={styles.exerciseVolume}>{ex.volume}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.restCard}>
            <Text style={styles.restIcon}>🧘</Text>
            <Text style={styles.restTitle}>Recovery Day</Text>
            <Text style={styles.restText}>Your AI coach recommends full recovery today to optimize long-term adaptations.</Text>
          </View>
        )}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-start",
    marginBottom: 30 
  },
  title: { fontSize: 28, fontWeight: "900", color: "#1E293B" },
  backText: { color: "#38BDF8", fontSize: 16, fontWeight: "700" },
  
  statusBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 20, 
    marginTop: 6,
    alignSelf: 'flex-start'
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  
  loadingText: { color: "#64748B", marginTop: 15, fontSize: 16, fontWeight: "600" },
  errorText: { color: "#ef4444", fontSize: 16, textAlign: "center", marginBottom: 20 },
  retryButton: { backgroundColor: "#FF6B6B", paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: "#FFFFFF", fontWeight: "800" },

  sessionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  sessionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  typeTag: { flexDirection: "row", alignItems: "center" },
  typeIcon: { fontSize: 20, marginRight: 10 },
  typeText: { fontSize: 14, fontWeight: "900", color: "#1E293B", letterSpacing: 1 },
  intensityTag: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8 },
  intensityTagText: { fontSize: 11, fontWeight: "800" },

  metricRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  metricLabel: { color: "#64748B", fontSize: 14, fontWeight: "600" },
  metricValue: { color: "#1E293B", fontSize: 16, fontWeight: "800" },

  paceContainer: { 
    backgroundColor: "rgba(56, 189, 248, 0.15)", 
    padding: 15, 
    borderRadius: 15, 
    alignItems: "center", 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)"
  },
  paceLabel: { color: "#38BDF8", fontSize: 13, fontWeight: "800", marginBottom: 4, letterSpacing: 1 },
  paceValue: { color: "#38BDF8", fontSize: 32, fontWeight: "900" },

  description: { color: "#475569", fontSize: 15, lineHeight: 22, marginBottom: 20, fontWeight: "500" },

  exerciseContainer: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  exerciseTitle: { fontSize: 12, fontWeight: "800", color: "#94A3B8", marginBottom: 12, letterSpacing: 1 },
  exerciseRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  exerciseName: { color: "#1E293B", fontSize: 15, fontWeight: "700" },
  exerciseVolume: { color: "#FF6B6B", fontSize: 14, fontWeight: "700" },

  restCard: { 
    alignItems: "center", 
    padding: 40, 
    backgroundColor: "rgba(255, 255, 255, 0.7)", 
    borderRadius: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  restIcon: { fontSize: 50, marginBottom: 20 },
  restTitle: { fontSize: 22, fontWeight: "900", color: "#1E293B", marginBottom: 10 },
  restText: { color: "#64748B", textAlign: "center", lineHeight: 22, fontWeight: "500" },
});
