import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, removeUser, updateUser } from "../../utils/storage";
import { getProfile, updateProfile } from "../../services/api";

export default function AthleteProfile() {
  const router = useRouter();
  const [athlete, setAthlete] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [isEditingAchievements, setIsEditingAchievements] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Try loading from backend first
      const token = await AsyncStorage.getItem("token");
      if (token) {
        console.log("[Profile] Loading profile from backend...");
        const backendUser = await getProfile(token);

        // Map backend user to the format the UI expects
        const mappedUser = {
          ...backendUser,
          id: backendUser._id,
          profile: backendUser.profile || {},
        };

        setAthlete(mappedUser);
        if (mappedUser.profile?.achievements) {
          setAchievements(mappedUser.profile.achievements);
        }
        console.log("[Profile] Loaded from backend successfully");
        return;
      }
    } catch (error) {
      console.log("[Profile] Backend load failed, falling back to local:", error.message);
    }

    // Fallback to local storage
    const user = await getCurrentUser();
    if (user) {
      setAthlete(user);
      if (user.profile?.achievements) {
        setAchievements(user.profile.achievements);
      }
    }
  };

  const handleLogout = async () => {
    await removeUser();
    await AsyncStorage.removeItem("token");
    console.log("[Profile] Logged out — cleared user and token");
    router.replace("/role-selection");
  };

  const handleAddAchievement = () => {
    const newAchievement = {
      event: athlete.profile?.sport || "Sport",
      position: "",
      year: "",
    };

    const updatedAchievements = [...achievements, newAchievement];
    setAchievements(updatedAchievements);
    setIsEditingAchievements(true);
  };

  const handleUpdateAchievement = (index, field, value) => {
    const updatedAchievements = [...achievements];
    updatedAchievements[index] = {
      ...updatedAchievements[index],
      [field]: value,
    };
    setAchievements(updatedAchievements);
  };

  const handleSaveProfile = async () => {
    const updatedProfile = {
      ...athlete.profile,
      achievements: achievements,
    };

    // Save to local storage
    const updatedUser = {
      ...athlete,
      profile: updatedProfile,
    };
    await updateUser(updatedUser);
    setAthlete(updatedUser);
    setIsEditingAchievements(false);

    // Also save to backend
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await updateProfile(token, { profile: updatedProfile });
        console.log("[Profile] Achievements saved to backend");
      }
    } catch (error) {
      console.error("[Profile] Backend save failed:", error.message);
    }

    alert("Achievements saved successfully");
  };

  if (!athlete) {
    return (
      <LinearGradient colors={["#FFF5F5", "#FFE4E1"]} style={styles.container}>
        <Text style={{ color: "#1E293B" }}>Loading...</Text>
      </LinearGradient>
    );
  }

  const firstLetter = (athlete.name || "A").charAt(0).toUpperCase();

  return (
    <LinearGradient
      colors={["#FFF5F5", "#FFE4E1", "#FFF5F5"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Profile</Text>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstLetter}</Text>
          </View>
          <Text style={styles.name}>{athlete.name}</Text>
          <Text style={styles.subInfo}>
            {athlete.profile?.sport || "Sport"} • {athlete.profile?.experience || "Level"}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{athlete.profile?.age || "--"}</Text>
            <Text style={styles.statLabel}>Age</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{athlete.profile?.height || "--"} cm</Text>
            <Text style={styles.statLabel}>Height</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{athlete.profile?.weight || "--"} kg</Text>
            <Text style={styles.statLabel}>Weight</Text>
          </View>
        </View>

        {/* Physical Metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PHYSICAL METRICS</Text>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>BMI</Text>
            <Text style={styles.metricValue}>
              {athlete.profile?.bmi || "--"}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Category</Text>
            <Text
              style={[
                styles.metricValue,
                athlete.profile?.bmiCategory === "Underweight" && { color: "#38BDF8" },
                athlete.profile?.bmiCategory === "Normal" && { color: "#22C55E" },
                athlete.profile?.bmiCategory === "Overweight" && { color: "#F59E0B" },
                athlete.profile?.bmiCategory === "Obese" && { color: "#EF4444" },
              ]}
            >
              {athlete.profile?.bmiCategory || "Not calculated"}
            </Text>
          </View>
        </View>


        {/* Performance Snapshot */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PERFORMANCE SNAPSHOT</Text>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Goal</Text>
            <Text style={styles.metricValue}>
              {athlete.profile?.goal || "Not set"}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Availability</Text>
            <Text style={styles.metricValue}>
              {athlete.profile?.availability
                ? athlete.profile.availability + " days/week"
                : "Not set"}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Dominant Side</Text>
            <Text style={styles.metricValue}>
              {athlete.profile?.dominantSide || "Not set"}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Injury History</Text>
            <Text style={styles.metricValue}>
              {athlete.profile?.injury || "None"}
            </Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACHIEVEMENTS</Text>

          {achievements.length > 0 ? (
            achievements.map((item, index) => (
              <View key={index} style={styles.achievementRow}>
                <Text style={styles.metricLabel}>
                  {item.event}
                </Text>

                <TextInput
                  style={styles.achievementInput}
                  placeholder="Position"
                  placeholderTextColor="#9ca3af"
                  value={item.position}
                  onChangeText={(text) => handleUpdateAchievement(index, "position", text)}
                />

                <TextInput
                  style={styles.achievementInput}
                  placeholder="Year"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={item.year}
                  onChangeText={(text) => handleUpdateAchievement(index, "year", text)}
                />
              </View>
            ))
          ) : (
            <Text style={styles.cardText}>No achievements added</Text>
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddAchievement}
          >
            <Text style={styles.addButtonText}>+ Add Achievement</Text>
          </TouchableOpacity>

          {isEditingAchievements && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Achievements</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Best */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PERSONAL BEST</Text>

          {athlete.profile?.personalBest &&
           athlete.profile.personalBest.length > 0 ? (
            athlete.profile.personalBest.map((item, index) => (
              <View key={index} style={styles.metricRow}>
                <Text style={styles.metricLabel}>
                  {item.event}
                </Text>
                <Text style={styles.metricValue}>
                  {item.value}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardText}>No personal best recorded</Text>
          )}
        </View>

        {/* Injury History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>INJURY HISTORY</Text>

          {athlete.profile?.injuries &&
           athlete.profile.injuries.length > 0 ? (
            athlete.profile.injuries.map((item, index) => (
              <View key={index} style={styles.metricRow}>
                <Text style={styles.metricLabel}>
                  {item.injuryName}
                </Text>
                <Text style={styles.metricValue}>
                  {item.status}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardText}>No injuries reported</Text>
          )}
        </View>

        {/* Training Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TRAINING INFO</Text>
          <Text style={styles.cardText}>Event: {athlete.profile?.sport || "Not set"}</Text>
          <Text style={styles.cardText}>
            Experience: {athlete.profile?.experience || "Not set"}
          </Text>
          <Text style={styles.cardText}>
            Email: {athlete.email}
          </Text>
        </View>

        {/* Goal Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TRAINING GOAL</Text>
          <Text style={styles.cardText}>{athlete.profile?.goal || "No goal set"}</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  screenTitle: {
    color: "#1E293B",
    fontSize: 24,
    fontWeight: "900",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#38BDF8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  name: {
    color: "#1E293B",
    fontSize: 24,
    fontWeight: "900",
  },
  subInfo: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  statValue: {
    color: "#FF6B6B",
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  cardText: {
    color: "#1E293B",
    fontSize: 15,
    marginBottom: 4,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "900",
    fontSize: 16,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.5)",
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  metricValue: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "900",
  },
  addButton: {
    marginTop: 15,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#38BDF8",
  },
  addButtonText: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
  },
  achievementRow: {
    marginBottom: 16,
  },
  achievementInput: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#38BDF8",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
});
