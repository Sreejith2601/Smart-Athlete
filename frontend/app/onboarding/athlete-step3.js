import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Keyboard,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

export default function AthleteStep3() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Explicitly mapping params for safety
  const p_name = params.name;
  const p_email = params.email;
  const p_password = params.password;
  const p_role = params.role;
  const p_age = params.age;
  const p_gender = params.gender;
  const p_sport = params.sport;
  const p_experience = params.experience;
  const p_trainingMode = params.trainingMode;
  const p_bloodGroup = params.bloodGroup;
  const p_city = params.city;
  const p_state = params.state;
  const p_pinCode = params.pinCode;

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [dominantSide, setDominantSide] = useState("");
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState("");

  const calculateBMI = (h, w) => {
    const heightNum = Number(h);
    const weightNum = Number(w);

    if (!heightNum || !weightNum) {
      setBmi(null);
      setBmiCategory("");
      return;
    }

    const heightInMeters = heightNum / 100;
    const bmiValue = weightNum / (heightInMeters * heightInMeters);
    const roundedBMI = bmiValue.toFixed(1);

    let category = "";

    if (bmiValue < 18.5) {
      category = "Underweight";
    } else if (bmiValue < 25) {
      category = "Normal";
    } else if (bmiValue < 30) {
      category = "Overweight";
    } else {
      category = "Obese";
    }

    setBmi(roundedBMI);
    setBmiCategory(category);
  };

  const handleNext = () => {
    Keyboard.dismiss();
    if (!height.trim() || !weight.trim() || !dominantSide.trim()) {
      alert("Please fill all required fields");
      return;
    }

    router.push({
      pathname: "/onboarding/athlete-step4",
      params: {
        name: p_name,
        email: p_email,
        password: p_password,
        role: p_role || 'athlete',
        age: p_age,
        gender: p_gender,
        bloodGroup: p_bloodGroup,
        city: p_city,
        state: p_state,
        pinCode: p_pinCode,
        sport: p_sport,
        experience: p_experience,
        trainingMode: p_trainingMode,
        height,
        weight,
        dominantSide,
        bmi,
        bmiCategory,
      },
    });
  };

  return (
    <LinearGradient
      colors={["#FFF5F5", "#FFE4E1", "#FFF5F5"]}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* Glow circles */}
      <View style={styles.glowGreen} />
      <View style={styles.glowTeal} />

      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Athlete Profile</Text>
      <Text style={styles.subtitle}>Step 3 of 4</Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Height (cm) <Text style={styles.star}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={height}
          onChangeText={(text) => {
            setHeight(text);
            calculateBMI(text, weight);
          }}
          placeholder="Enter your height"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>
          Weight (kg) <Text style={styles.star}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={weight}
          onChangeText={(text) => {
            setWeight(text);
            calculateBMI(height, text);
          }}
          placeholder="Enter your weight"
          placeholderTextColor="#94A3B8"
        />

        {bmi && (
          <View style={styles.bmiCard}>
            <Text style={styles.bmiText}>BMI: {bmi}</Text>
            <Text
              style={[
                styles.bmiCategory,
                bmiCategory === "Underweight" && { color: "#38BDF8" },
                bmiCategory === "Normal" && { color: "#22C55E" },
                bmiCategory === "Overweight" && { color: "#F59E0B" },
                bmiCategory === "Obese" && { color: "#EF4444" },
              ]}
            >
              Category: {bmiCategory}
            </Text>
          </View>
        )}

        <Text style={styles.label}>
          Dominant Hand / Leg <Text style={styles.star}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={dominantSide}
          onChangeText={setDominantSide}
          placeholder="Right / Left"
          placeholderTextColor="#94A3B8"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 60,
  },

  glowGreen: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FF6B6B",
    top: 80,
    right: -40,
    opacity: 0.15,
  },

  glowTeal: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#38BDF8",
    bottom: 60,
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
    color: "#EF4444",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  backButton: {
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    width: "45%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  nextButton: {
    backgroundColor: "#FF6B6B",
    padding: 14,
    borderRadius: 12,
    width: "45%",
    alignItems: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonText: {
    color: "#64748B",
    fontWeight: "700",
  },

  nextButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  
  bmiCard: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
  },

  bmiText: {
    color: "#1E293B",
    fontWeight: "800",
    fontSize: 15,
  },

  bmiCategory: {
    fontWeight: "700",
    marginTop: 4,
  },
});
