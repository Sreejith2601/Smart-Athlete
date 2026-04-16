import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAthletes } from "../../services/api";

export default function WorkloadScreen() {
  const router = useRouter();
  const [athletes, setAthletes] = useState([]);

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Fetch from MongoDB
        const backendAthletes = await getAthletes(token);
        const mappedAuth = backendAthletes.map((u) => ({ ...u, id: u._id }));
        setAthletes(mappedAuth);
      }
    } catch (error) {
      console.log("Error loading athletes:", error);
    }
  };

  return (
    <LinearGradient colors={["#FFF5F5", "#FFE4E1", "#FFF5F5"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Workload</Text>

        <View style={styles.grid}>
          {(Array.isArray(athletes) ? athletes : []).map((athlete, index) => {
            const name = athlete.name || "Athlete";
            const sport = athlete.profile?.sport || "Sport";

            return (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/coach/workload-detail",
                    params: { id: athlete.id },
                  })
                }
              >
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.sport}>{sport}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 60,
  },
  header: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    width: "48%",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  name: {
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "900",
  },
  sport: {
    color: "#64748B",
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
