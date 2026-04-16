import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function WorkloadDetail() {
  const { id } = useLocalSearchParams();
  const [athlete, setAthlete] = useState(null);
  const [sessions, setSessions] = useState([]);


  const loadData = useCallback(async () => {
    try {
      const usersData = await AsyncStorage.getItem("users");
      const users = usersData ? JSON.parse(usersData) : [];

      const foundAthlete = users.find(
        (u) => String(u.id) === String(id)
      );

      const sessionsData = await AsyncStorage.getItem("trainingSessions");
      const allSessions = sessionsData ? JSON.parse(sessionsData) : [];

      const athleteSessions = allSessions.filter(
        (s) => String(s.athleteId) === String(id)
      );

      setAthlete(foundAthlete || null);
      setSessions(athleteSessions);
    } catch (error) {
      console.log("Error loading workload data:", error);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!athlete) {
    return (
      <LinearGradient colors={["#FFF5F5", "#FFE4E1"]} style={styles.center}>
        <Text style={styles.loading}>Loading athlete profile...</Text>
      </LinearGradient>
    );
  }

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const lastSession = sorted[0];

  const avgFatigue =
    sessions.length > 0
      ? sessions.reduce(
          (sum, s) => sum + (Number(s.fatigue) || 0),
          0
        ) / sessions.length
      : 0;

  const avgPace =
    sessions.length > 0
      ? sessions.reduce(
          (sum, s) => sum + (Number(s.pace) || 0),
          0
        ) / sessions.length
      : 0;

  const now = new Date();
  const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

  const todaySession = sessions.find((s) =>
    s.date?.startsWith(today)
  );

  let workloadLabel = "Low";
  let color = "#38BDF8";

  if (avgFatigue >= 8) {
    workloadLabel = "High";
    color = "#FF6B6B";
  } else if (avgFatigue >= 5) {
    workloadLabel = "Moderate";
    color = "#F59E0B";
  }

  return (
    <LinearGradient colors={["#FFF5F5", "#FFE4E1", "#FFF5F5"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>
          {athlete.name} Workload
        </Text>

        {/* Last Session */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>LAST SESSION</Text>

          {lastSession ? (
            <>
              <Text style={styles.item}>
                Date: {lastSession.date}
              </Text>
              <Text style={styles.item}>
                Pace: {lastSession.pace || "-"}
              </Text>
              <Text style={styles.item}>
                Duration: {lastSession.duration || "-"}
              </Text>
              <Text style={styles.item}>
                Fatigue: {lastSession.fatigue || "-"}
              </Text>
            </>
          ) : (
            <Text style={styles.noData}>
              No sessions found
            </Text>
          )}
        </View>

        {/* Daily Performance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DAILY PERFORMANCE</Text>

          {todaySession ? (
            <>
              <Text style={styles.item}>
                Pace: {todaySession.pace || "-"}
              </Text>
              <Text style={styles.item}>
                Fatigue: {todaySession.fatigue || "-"}
              </Text>
            </>
          ) : (
            <Text style={styles.noData}>
              No session today
            </Text>
          )}
        </View>

        {/* Average Performance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AVERAGE PERFORMANCE</Text>

          <Text style={[styles.value, { color }]}>
            {workloadLabel}
          </Text>

          <Text style={styles.subText}>
            Avg pace: {avgPace.toFixed(1)}
          </Text>

          <Text style={styles.subText}>
            Avg fatigue: {avgFatigue.toFixed(1)}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    color: "#64748B",
    fontWeight: "600",
  },
  header: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
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
    marginBottom: 16,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  item: {
    color: "#1E293B",
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "600",
  },
  value: {
    fontSize: 32,
    fontWeight: "900",
    marginVertical: 4,
  },
  subText: {
    color: "#64748B",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
  },
  noData: {
    color: "#94A3B8",
    fontStyle: "italic",
    fontWeight: "600",
  },
});
