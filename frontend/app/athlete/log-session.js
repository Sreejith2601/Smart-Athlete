import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveTrainingSession } from "../../services/api";

// 🔥 we will create this next
import watchService from "../../services/watchService";

export default function LogSessionScreen() {
  const router = useRouter();
  const { sessionId, startTime } = useLocalSearchParams();

  const [pulse, setPulse] = useState("");
  const [distanceVal, setDistanceVal] = useState("");
  const [durationVal, setDurationVal] = useState("");
  const [rpe, setRpe] = useState(5);
  const [fatigue, setFatigue] = useState(5);
  const [notes, setNotes] = useState("");
  const [wearableMode, setWearableMode] = useState(false);
  const [effort, setEffort] = useState("moderate"); // easy, moderate, hard
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("Error", "Authentication failed. Please log in again.");

      // 1. Fetch Watch Data (with safe fallback)
      let watchHeartRate = null;
      let watchDuration = null;
      let watchDistance = null;
      let watchSteps = 0;

      if (wearableMode) {
        try {
          const data = await watchService.getWorkoutData();
          if (data?.status === "success") {
            if (data.heartRate) watchHeartRate = data.heartRate;
            if (data.duration) watchDuration = data.duration;
            if (data.distance) watchDistance = data.distance;
            if (data.steps) watchSteps = data.steps;
          } else {
            console.warn("[LogSession] Watch data unavailable, falling back to manual input.");
          }
        } catch (err) {
          console.error("[LogSession] Watch fetch failed:", err);
        }
      }

      // 2. Compute Duration & Final Values
      // Priority: 1. Watch Data -> 2. Manual Typed Value -> 3. Automatic Timer / Default 0
      const calculatedTimer = startTime
        ? Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 60000))
        : 0;
        
      const finalDuration = watchDuration || (durationVal ? parseFloat(durationVal) : calculatedTimer);
      const finalDistance = watchDistance || (distanceVal ? parseFloat(distanceVal) : 0);

      // 3. Build Clean Payload
      const logData = {
        sessionId,
        pulse: watchHeartRate || pulse || 0,
        rpe,
        fatigue,
        effort: wearableMode ? undefined : effort,
        feedback: notes,
        source: wearableMode ? "wearable" : "manual",
        duration: finalDuration,
        caloriesBurned: 0,
        distance: finalDistance, 
        steps: watchSteps,
      };
      
      console.log("[LogSession] Submitting payload:", JSON.stringify(logData, null, 2));

      // 4. Submit Data
      await saveTrainingSession(token, logData);

      // 5. Handle Success Navigation cleanly platform-by-platform
      const successMsg = "Session logged successfully!";
      if (Platform.OS === "web") {
        alert(successMsg);
        router.replace("/athlete/home");
      } else {
        Alert.alert("Success", successMsg, [
          { text: "OK", onPress: () => router.replace("/athlete/home") },
        ]);
      }
    } catch (error) {
      console.error("[LogSession] Failed to save session:", error);
      Alert.alert("Error", "Failed to save session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Log Training Session</Text>

        {/* Wearable Integration */}
        <View style={styles.wearablePanel}>
          <Text style={styles.wearableTitle}>
            WEARABLE INTEGRATION
          </Text>

          <View style={styles.wearableRow}>
            <Text style={styles.wearableLabel}>
              Connected Device: Smartwatch
            </Text>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                wearableMode && { backgroundColor: "#22c55e" },
              ]}
              onPress={() => setWearableMode(!wearableMode)}
            >
              <Text style={styles.toggleText}>
                {wearableMode ? "ON" : "OFF"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Body Metrics */}
        <Text style={styles.sectionTitle}>MANUAL METRICS</Text>
        <Text style={{color: '#9ca3af', fontSize: 11, marginBottom: 16}}>
          Leave these blank to use the automatic live timer and watch data.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Pulse Rate (bpm)"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={pulse}
          onChangeText={setPulse}
        />

        <TextInput
          style={styles.input}
          placeholder="Actual Distance (km)"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={distanceVal}
          onChangeText={setDistanceVal}
        />

        <TextInput
          style={styles.input}
          placeholder="Actual Duration (mins)"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={durationVal}
          onChangeText={setDurationVal}
        />

        <Text style={styles.label}>Effort Level</Text>
        <View style={styles.effortRow}>
          {["easy", "moderate", "hard"].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.effortBtn,
                effort === level && styles.effortBtnActive,
              ]}
              onPress={() => {
                setEffort(level);
                // Also update RPE for consistency
                if (level === "easy") setRpe(3);
                else if (level === "moderate") setRpe(6);
                else if (level === "hard") setRpe(9);
              }}
            >
              <Text style={[
                styles.effortText,
                effort === level && styles.effortTextActive
              ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>RPE: {rpe}</Text>
        <View style={styles.sliderRow}>
          {[1,2,3,4,5,6,7,8,9,10].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.fatigueDot,
                rpe === level && styles.fatigueActive,
              ]}
              onPress={() => setRpe(level)}
            >
              <Text style={styles.fatigueText}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Fatigue: {fatigue}</Text>
        <View style={styles.sliderRow}>
          {[1,2,3,4,5,6,7,8,9,10].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.fatigueDot,
                fatigue === level && styles.fatigueActive,
              ]}
              onPress={() => setFatigue(level)}
            >
              <Text style={styles.fatigueText}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>SESSION FEEDBACK</Text>

        <TextInput
          style={[styles.input, styles.notes]}
          placeholder="How did today's training feel?"
          placeholderTextColor="#94A3B8"
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.saveBtn, loading && styles.disabledBtn]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveText}>{loading ? "Saving..." : "Save Session"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F5",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 24,
  },
  wearablePanel: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  wearableTitle: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
  },
  wearableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wearableLabel: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "600",
  },
  toggleButton: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleText: {
    color: "#475569",
    fontWeight: "800",
    fontSize: 13,
  },
  sectionTitle: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    color: "#1E293B",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontWeight: "600",
  },
  effortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  effortBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  effortBtnActive: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderColor: "#38BDF8",
  },
  effortText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  effortTextActive: {
    color: "#38BDF8",
    fontWeight: "800",
  },
  notes: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  label: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },
  sliderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fatigueDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  fatigueActive: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  fatigueText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF5F5",
    borderTopWidth: 1,
    borderTopColor: "#FFE4E1",
  },
  cancelBtn: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelText: {
    color: "#64748B",
    fontWeight: "800",
    fontSize: 16,
  },
  saveBtn: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#38BDF8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  disabledBtn: {
    backgroundColor: "#bae6fd",
    opacity: 0.7,
  },
});