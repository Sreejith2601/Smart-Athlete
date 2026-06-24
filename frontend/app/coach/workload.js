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
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAthletes } from "../../services/api";
import { useResponsiveLayout } from "../../utils/webStyles";

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

  const { isWeb } = useResponsiveLayout();

  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webHeaderRow}>
          <Text style={styles.webHeader}>Squad Workload Monitor</Text>
        </View>

        <ScrollView contentContainerStyle={styles.webGridScroll} showsVerticalScrollIndicator={true}>
          <View style={styles.webGrid}>
            {(Array.isArray(athletes) ? athletes : []).map((athlete, index) => {
              const name = athlete.name || "Athlete";
              const sport = athlete.profile?.sport || "Sport";

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.webCard}
                  onPress={() =>
                    router.push({
                      pathname: "/coach/workload-detail",
                      params: { id: athlete.id },
                    })
                  }
                >
                  <View style={styles.webAvatarContainer}>
                    <LinearGradient colors={["#38BDF8", "#3B82F6"]} style={styles.webAvatar}>
                      <Text style={styles.webAvatarText}>{(name).charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.webName}>{name}</Text>
                  <Text style={styles.webSport}>{sport}</Text>
                  
                  <View style={styles.webCardFooter}>
                    <Text style={styles.webFooterText}>View Workload History</Text>
                    <Ionicons name="chevron-forward" size={14} color="#38BDF8" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

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
  // Web Styles
  webContainer: {
    flex: 1,
    padding: 30,
    backgroundColor: '#0F172A',
  },
  webHeaderRow: {
    marginBottom: 30,
  },
  webHeader: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  webGridScroll: {
    paddingBottom: 40,
  },
  webGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  webCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 24,
    borderRadius: 24,
    width: 280,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    gap: 8,
  },
  webAvatarContainer: {
    marginBottom: 10,
  },
  webAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  webAvatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  webName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  webSport: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  webCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.02)',
    width: '100%',
  },
  webFooterText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
});
