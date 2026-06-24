import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { createTrainingPlan } from "../../services/api";
import { useResponsiveLayout } from "../../utils/webStyles";

const { width } = Dimensions.get("window");

export default function CreatePlan() {
  const router = useRouter();
  const { id, athleteId: paramId } = useLocalSearchParams();
  const athleteId = id || paramId;
  const { isWeb } = useResponsiveLayout();

  const [planName, setPlanName] = useState("Weekly Focus");
  const [trainingType, setTrainingType] = useState("");
  const [sessionSlot, setSessionSlot] = useState("Morning");
  const [mainWork, setMainWork] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("");
  const [notes, setNotes] = useState("");
  
  const today = new Date();
  const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  const [date, setDate] = useState(localDate);

  const savePlan = async () => {
    try {
      if (!trainingType || !mainWork) {
        Alert.alert("Incomplete Directives", "Please specify training type and main focus.");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      const sessionDate = new Date(date).toISOString();
      const planData = {
        athleteId,
        planName,
        startDate: sessionDate,
        endDate: sessionDate,
        sessions: [
          {
            trainingType,
            mainWork,
            duration,
            intensity,
            sessionSlot,
            notes,
            date: sessionDate,
            status: "pending"
          }
        ],
        trainingType,
        mainWork,
        duration,
        intensity,
        sessionSlot,
        notes,
        date: sessionDate
      };
      
      await createTrainingPlan(planData, token);
      router.back();
    } catch (error) {
      console.error("Error saving plan:", error);
      Alert.alert("Transmission Failed", error.message || "Failed to sync protocol with central server.");
    }
  };

  const renderInput = (label, value, setter, placeholder, multiline = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.glassInput, multiline && styles.multiLineInput]}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          style={styles.textInput}
          value={value}
          onChangeText={setter}
          multiline={multiline}
        />
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Protocol Editor</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, isWeb && styles.webScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(100)}>
          <Text style={styles.sectionTitle}>SESSION PROTOCOL</Text>
          
          {renderInput("PLAN IDENTIFIER", planName, setPlanName, "Plan Name")}
          {renderInput("TIMESTAMP (YYYY-MM-DD)", date, setDate, "Date")}
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              {renderInput("MODE", trainingType, setTrainingType, "Type")}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              {renderInput("WINDOW", sessionSlot, setSessionSlot, "Slot")}
            </View>
          </View>

          {renderInput("CORE DIRECTIVE", mainWork, setMainWork, "e.g., 6km Threshold Run")}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              {renderInput("DURATION", duration, setDuration, "HH:MM")}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              {renderInput("INTENSITY", intensity, setIntensity, "Target Effort")}
            </View>
          </View>

          {renderInput("OPERATIONAL NOTES", notes, setNotes, "Additional technical details...", true)}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={savePlan}>
            <LinearGradient 
              colors={["#38BDF8", "#3B82F6"]} 
              style={styles.saveGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.saveBtnText}>DEPLOY TO ATHLETE</Text>
              <Ionicons name="paper-plane" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelBtnText}>ABORT DIRECTIVE</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  sectionTitle: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.5,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  glassInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  multiLineInput: {
    height: 120,
    paddingVertical: 14,
    justifyContent: 'flex-start',
  },
  textInput: {
    color: "#F1F5F9",
    fontSize: 15,
    fontWeight: "600",
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    marginTop: 20,
  },
  saveBtn: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  saveGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  cancelBtn: {
    width: '100%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  cancelBtnText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  webScrollContent: {
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
    marginTop: 20,
  },
});
