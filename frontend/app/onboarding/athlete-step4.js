import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { setCurrentUser } from '../../utils/storage';
import { registerUser } from '../../services/api';

export default function AthleteStep4() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Explicitly mapping params for safety to avoid ReferenceErrors
  const p_name = params.name;
  const p_email = params.email;
  const p_password = params.password;
  const p_role = params.role;
  const p_age = params.age;
  const p_gender = params.gender;
  const p_sport = params.sport;
  const p_experience = params.experience;
  const p_trainingMode = params.trainingMode;
  const p_height = params.height;
  const p_weight = params.weight;
  const p_dominantSide = params.dominantSide;
  const p_bmi = params.bmi;
  const p_bmiCategory = params.bmiCategory;
  const p_bloodGroup = params.bloodGroup;
  const p_city = params.city;
  const p_state = params.state;
  const p_pinCode = params.pinCode;

  // State for Goal & Medical
  const [goal, setGoal] = useState('');
  const [injury, setInjury] = useState('');

  // State for Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // State for Dynamic Achievements
  const [achievements, setAchievements] = useState([]);
  const [newAchEvent, setNewAchEvent] = useState('');
  const [newAchPos, setNewAchPos] = useState('');
  const [newAchYear, setNewAchYear] = useState('');

  const [personalBestValue, setPersonalBestValue] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addAchievement = () => {
    if (!newAchEvent || !newAchPos || !newAchYear) {
      Alert.alert("Incomplete", "Please fill all three fields to add a competition record.");
      return;
    }
    const newAch = {
      event: newAchEvent,
      position: newAchPos,
      year: newAchYear
    };
    setAchievements([...achievements, newAch]);
    setNewAchEvent('');
    setNewAchPos('');
    setNewAchYear('');
  };

  const removeAchievement = (index) => {
    const updated = achievements.filter((_, i) => i !== index);
    setAchievements(updated);
  };

  const handleFinish = async () => {
    if (isSubmitting) return;

    if (!goal.trim() || !emergencyName.trim() || !emergencyPhone.trim()) {
      Alert.alert("Missing Fields", "Please specify your Training Goal and Emergency Contact information.");
      return;
    }

    if (!p_name || !p_email || !p_password) {
      Alert.alert("Registration Error", "Basic registration data is missing. Please restart the onboarding process.", [
        { text: "Go Back", onPress: () => router.replace("/register") }
      ]);
      return;
    }

    setIsSubmitting(true);

    const athleteProfile = {
      age: p_age,
      gender: p_gender,
      sport: p_sport,
      experience: p_experience,
      trainingMode: p_trainingMode,
      height: p_height,
      weight: p_weight,
      dominantSide: p_dominantSide,
      bmi: p_bmi,
      bmiCategory: p_bmiCategory,
      goal: goal,
      bloodGroup: p_bloodGroup,
      address: { city: p_city, state: p_state, pinCode: p_pinCode },
      emergencyContact: { name: emergencyName, phone: emergencyPhone },
      injuries: injury
        ? [
            {
              injuryName: injury,
              year: "",
              status: "Recovered",
              notes: "",
            },
          ]
        : [],
      achievements: achievements,
      personalBest: personalBestValue
        ? [
            {
              event: p_sport,
              value: personalBestValue,
            },
          ]
        : [],
    };

    // --- Backend Registration ---
    const backendUserData = {
      name: p_name,
      email: p_email,
      password: p_password,
      role: p_role || 'athlete',
      trainingMode: athleteProfile.trainingMode,
      age: athleteProfile.age ? parseInt(athleteProfile.age) : undefined,
      gender: athleteProfile.gender,
      sport: athleteProfile.sport,
      specialization: athleteProfile.goal,
      experience: athleteProfile.experience ? parseInt(athleteProfile.experience) : undefined,
      profile: athleteProfile,
    };

    try {
      const response = await registerUser(backendUserData);
      console.log("[Step4] Backend Registration SUCCESS");
      
      const updatedUser = {
        id: response.userId || Date.now().toString(),
        name: p_name,
        email: p_email,
        role: p_role || 'athlete',
        onboardingCompleted: true,
        profile: athleteProfile,
      };

      await setCurrentUser(updatedUser);
      setShowSuccess(true);
      Alert.alert("Success!", "Your profile has been created successfully. Welcome to the team!");

      setTimeout(() => {
        router.replace('/login');
      }, 2000);

    } catch (error) {
      console.error("[Step4] Registration FAILED:", error.message);
      Alert.alert("Registration Failed", `Error: ${error.message || "Something went wrong. Please check your connection."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={["#FFF5F5", "#FFE4E1", "#FFF5F5"]}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.glowCircleTop} />
        <View style={styles.glowCircleBottom} />

        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>SMART ATHLETE</Text>
        <Text style={styles.subtitle}>Final Polish – Step 4 of 4</Text>

        <View style={styles.card}>
          {/* Training Goal */}
          <Text style={styles.label}>
            Training Goal <Text style={styles.star}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Marathon Sub 3hr"
            placeholderTextColor="#94A3B8"
            value={goal}
            onChangeText={setGoal}
          />

          {/* Emergency Contact */}
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Contact Name"
              placeholderTextColor="#94A3B8"
              value={emergencyName}
              onChangeText={setEmergencyName}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Phone (e.g. 98765...)"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
            />
          </View>

          {/* Past Competition History */}
          <Text style={styles.sectionTitle}>Past Competition History</Text>
          <View style={styles.achievementInputCard}>
             <TextInput
               style={styles.smallInput}
               placeholder="Event (e.g. District 100m)"
               placeholderTextColor="#94A3B8"
               value={newAchEvent}
               onChangeText={setNewAchEvent}
             />
             <View style={styles.row}>
               <TextInput
                 style={[styles.smallInput, { flex: 1, marginRight: 8 }]}
                 placeholder="Pos (e.g. 1st)"
                 placeholderTextColor="#94A3B8"
                 value={newAchPos}
                 onChangeText={setNewAchPos}
               />
               <TextInput
                 style={[styles.smallInput, { flex: 1, marginRight: 8 }]}
                 placeholder="Year"
                 placeholderTextColor="#94A3B8"
                 keyboardType="numeric"
                 value={newAchYear}
                 onChangeText={setNewAchYear}
               />
               <TouchableOpacity style={styles.addBtn} onPress={addAchievement}>
                 <Ionicons name="add-circle" size={28} color="#FF6B6B" />
               </TouchableOpacity>
             </View>
          </View>

          {/* Achievements List */}
          {achievements.length > 0 && (
            <View style={styles.achList}>
              {achievements.map((item, idx) => (
                <View key={idx} style={styles.achItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.achTextMain}>{item.event}</Text>
                    <Text style={styles.achTextSub}>{item.position} • {item.year}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeAchievement(idx)}>
                    <Ionicons name="close-circle" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.label}>Injury History (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any past major injuries"
            placeholderTextColor="#94A3B8"
            value={injury}
            onChangeText={setInjury}
            multiline
          />

          <Text style={styles.label}>Personal Best Performance (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 10.8 sec or 2:45:00 hr"
            placeholderTextColor="#94A3B8"
            value={personalBestValue}
            onChangeText={setPersonalBestValue}
          />

          {showSuccess && (
            <Text style={styles.successText}>
              Registration and Profile creation successful!
            </Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleFinish}
            >
              <Text style={styles.nextText}>Finish</Text>
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
    padding: 24,
    paddingTop: 60,
    paddingBottom: 80,
  },
  glowCircleTop: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FF6B6B",
    opacity: 0.1,
    top: 80,
    right: -60,
  },
  glowCircleBottom: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#38BDF8",
    opacity: 0.1,
    bottom: 80,
    left: -60,
  },
  logo: { width: 60, height: 60, marginBottom: 12 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#64748B",
    marginBottom: 20,
    marginTop: 4,
    fontWeight: "600",
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B6B",
    paddingLeft: 8,
  },
  label: {
    color: "#475569",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
  },
  star: { color: "#EF4444" },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  smallInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  textArea: { height: 60, textAlignVertical: "top" },
  achievementInputCard: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.2)",
    borderStyle: "dashed",
  },
  achList: { marginBottom: 16 },
  achItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  achTextMain: { color: '#1E293B', fontWeight: '700', fontSize: 13 },
  achTextSub: { color: '#64748B', fontSize: 11, marginTop: 2 },
  addBtn: { justifyContent: 'center', alignItems: 'center', paddingBottom: 10 },
  successText: {
    marginTop: 10,
    color: "#FF6B6B",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  row: { flexDirection: 'row' },
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
  },
  backText: { color: "#64748B", fontWeight: "700" },
  nextText: { color: "#FFFFFF", fontWeight: "800" },
});

