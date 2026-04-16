import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser, updateUser } from "../../utils/storage";
import { updateProfile } from "../../services/api";

export default function LogCycle() {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");

  const isValidDate = (dateString) => {
    // Check format YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    const today = new Date();

    // Invalid date or future date
    if (isNaN(date.getTime())) return false;
    if (date > today) return false;

    return true;
  };

  const handleSave = async () => {
    try {
      if (!isValidDate(startDate)) {
        alert("Please enter a valid date in YYYY-MM-DD format");
        return;
      }

      const cycleData = { lastPeriodStart: startDate };

      // Update backend
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          await updateProfile(token, { cycle: cycleData });
          console.log("[LogCycle] Backend updated successfully");
        }
      } catch (error) {
        console.error("[LogCycle] Failed to update backend:", error.message);
      }

      // Update local storage
      const user = await getCurrentUser();
      if (user) {
        const updatedUser = {
          ...user,
          cycle: { ...user.cycle, ...cycleData },
        };
        await updateUser(updatedUser);
      }

      alert("Cycle data saved");
      router.back();
    } catch (error) {
      console.log("Error saving cycle:", error);
      alert("Error saving cycle data");
    }
  };

  return (
    <LinearGradient colors={["#0f2f36", "#2f5a63"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Log Period</Text>

        <Text style={styles.label}>Period Start Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={startDate}
          onChangeText={setStartDate}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
