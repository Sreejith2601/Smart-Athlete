import { View, Text, Pressable, StyleSheet, Image, ScrollView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";

export default function AthleteStep2() {
  const router = useRouter();
  const { 
    name, email, password, role, age, gender, 
    bloodGroup, city, state, pinCode 
  } = useLocalSearchParams();

  const [sport, setSport] = useState("");
  const [experience, setExperience] = useState("");
  const [trainingMode, setTrainingMode] = useState("");

  const handleNext = () => {
    if (!sport || !experience || !trainingMode) {
      alert("Please complete all required fields");
      return;
    }

    router.push({
      pathname: "/onboarding/athlete-step3",
      params: {
        name,
        email,
        password,
        role,
        age,
        gender,
        bloodGroup,
        city,
        state,
        pinCode,
        sport,
        experience,
        trainingMode,
      },
    });
  };

  return (
    <LinearGradient colors={["#FFF5F5", "#FFE4E1", "#FFF5F5"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Glow shapes */}
        <View style={styles.glowGreen} />
        <View style={styles.glowCyan} />

      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Athlete Profile</Text>
      <Text style={styles.subtitle}>Step 2 of 4</Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Event <Text style={styles.star}>*</Text>
        </Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={sport}
            dropdownIconColor="#FF6B6B"
            onValueChange={(itemValue) => setSport(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Select event" value="" />
            <Picker.Item label="800m" value="800m" />
            <Picker.Item label="1500m" value="1500m" />
            <Picker.Item label="3000m" value="3000m" />
            <Picker.Item label="5000m" value="5000m" />
            <Picker.Item label="10K" value="10k" />
            <Picker.Item label="Half Marathon" value="half_marathon" />
            <Picker.Item label="Marathon" value="marathon" />
          </Picker>
        </View>

        <Text style={styles.label}>
          Experience Level <Text style={styles.star}>*</Text>
        </Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={experience}
            dropdownIconColor="#FF6B6B"
            onValueChange={(itemValue) => setExperience(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Select experience" value="" />
            <Picker.Item label="Beginner" value="beginner" />
            <Picker.Item label="Intermediate" value="intermediate" />
            <Picker.Item label="Advanced" value="advanced" />
          </Picker>
        </View>

        <Text style={styles.label}>
          Training Mode <Text style={styles.star}>*</Text>
        </Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={trainingMode}
            dropdownIconColor="#FF6B6B"
            onValueChange={(itemValue) => setTrainingMode(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Select training mode" value="" />
            <Picker.Item label="Self-trained" value="self" />
            <Picker.Item label="Under a Coach" value="coach" />
          </Picker>
        </View>

        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
      </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
    paddingBottom: 60,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
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
    width: 80,
    height: 80,
    marginBottom: 14,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
  },

  subtitle: {
    color: "#64748B",
    marginBottom: 26,
    marginTop: 4,
    fontWeight: "600",
  },

  card: {
    width: "100%",
    maxWidth: 600,
    padding: 22,
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

  label: {
    color: "#475569",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  star: {
    color: "#ef4444",
  },

  pickerWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...(Platform.OS === 'ios' ? { height: 130, justifyContent: 'center' } : {})
  },

  picker: {
    color: Platform.OS === 'ios' ? "#1E293B" : "#1E293B",
    backgroundColor: "transparent",
    ...(Platform.OS === 'ios' ? { height: 130 } : {})
  },

  pickerItem: {
    color: "#1E293B",
    height: 130,
    fontSize: 15,
  },

  button: {
    backgroundColor: "#FF6B6B",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
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
});
