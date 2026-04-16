import { View, Text, TextInput, Pressable, StyleSheet, Image, TouchableOpacity, Keyboard, ScrollView, Modal, FlatList, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function AthleteStep1() {
  const router = useRouter();
  const { name, email, password, role } = useLocalSearchParams();

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [isBloodModalVisible, setIsBloodModalVisible] = useState(false);

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const handleNext = () => {
    Keyboard.dismiss();
    if (!age.trim() || !gender.trim() || !bloodGroup || !city.trim() || !state.trim() || !pinCode.trim()) {
      alert("Please fill all required fields (Age, Gender, Blood Group, and Address)");
      return;
    }

    router.push({
      pathname: "/onboarding/athlete-step2",
      params: { 
        name, email, password, role, 
        age, gender, bloodGroup, 
        city, state, pinCode 
      },
    });
  };

  const renderBloodModal = () => (
    <Modal
      visible={isBloodModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsBloodModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setIsBloodModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Blood Group</Text>
            <TouchableOpacity onPress={() => setIsBloodModalVisible(false)}>
              <Ionicons name="close-circle" size={28} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={bloodGroups}
            keyExtractor={(item) => item}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.bloodOption,
                  bloodGroup === item && styles.bloodOptionSelected
                ]}
                onPress={() => {
                  setBloodGroup(item);
                  setIsBloodModalVisible(false);
                }}
              >
                <Text style={[
                  styles.bloodOptionText,
                  bloodGroup === item && styles.bloodOptionTextSelected
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
      {/* Glow shapes */}
      <View style={styles.glowGreen} />
      <View style={styles.glowCyan} />

      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Athlete Profile</Text>
      <Text style={styles.subtitle}>Step 1 of 4</Text>

      <View style={styles.card}>
        {/* Age */}
        <Text style={styles.label}>
          Age <Text style={styles.star}>*</Text>
        </Text>
        <TextInput
          placeholder="Enter your age"
          placeholderTextColor="#94A3B8"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          style={styles.input}
        />

        {/* Gender */}
        <Text style={styles.label}>
          Gender <Text style={styles.star}>*</Text>
        </Text>

        <View style={styles.genderRow}>
          {["male", "female", "other"].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.genderButton,
                gender === item && styles.genderButtonActive,
              ]}
              onPress={() => setGender(item)}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === item && styles.genderTextActive,
                ]}
              >
                {item.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Blood Group Selector */}
        <Text style={styles.label}>
          Blood Group <Text style={styles.star}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.customSelectInput}
          onPress={() => setIsBloodModalVisible(true)}
        >
          <Text style={[
            styles.selectText,
            !bloodGroup && { color: "#94A3B8" }
          ]}>
            {bloodGroup || "Select Blood Group"}
          </Text>
          <Ionicons name="chevron-down-circle" size={24} color="#FF6B6B" />
        </TouchableOpacity>

        {/* Address */}
        <Text style={styles.label}>
          Address / Location <Text style={styles.star}>*</Text>
        </Text>
        <TextInput
          placeholder="City"
          placeholderTextColor="#94A3B8"
          value={city}
          onChangeText={setCity}
          style={styles.input}
        />
        <View style={styles.row}>
          <TextInput
            placeholder="State"
            placeholderTextColor="#94A3B8"
            value={state}
            onChangeText={setState}
            style={[styles.input, { flex: 1, marginRight: 10 }]}
          />
          <TextInput
            placeholder="Pin Code"
            placeholderTextColor="#94A3B8"
            value={pinCode}
            onChangeText={setPinCode}
            keyboardType="number-pad"
            style={[styles.input, { flex: 1 }]}
          />
        </View>

        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
      </View>
      </ScrollView>

      {/* Renders the Custom Modal */}
      {renderBloodModal()}
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

  customSelectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  selectText: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
  },

  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  genderButtonActive: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderColor: "#FF6B6B",
  },

  genderText: {
    color: "#64748B",
    fontWeight: "600",
  },

  genderTextActive: {
    color: "#FF6B6B",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: Dimensions.get("window").height * 0.5,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },

  listContainer: {
    paddingBottom: 10,
  },

  bloodOption: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    margin: 6,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  bloodOptionSelected: {
    borderColor: "#FF6B6B",
    backgroundColor: "rgba(255, 107, 107, 0.05)",
  },

  bloodOptionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
  },

  bloodOptionTextSelected: {
    color: "#FF6B6B",
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
