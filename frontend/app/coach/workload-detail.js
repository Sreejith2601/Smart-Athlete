import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

      import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAthletes, getAthleteSessionHistory } from "../../services/api";
import { useResponsiveLayout } from "../../utils/webStyles";

export default function WorkloadDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [athlete, setAthlete] = useState(null);
  const [sessions, setSessions] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Try backend loading first
        const [backendAthletes, backendSessions] = await Promise.all([
          getAthletes(token),
          getAthleteSessionHistory(token, id)
        ]);

        const mappedAthletes = (Array.isArray(backendAthletes) ? backendAthletes : []).map(u => ({ ...u, id: u._id }));
        const foundAthlete = mappedAthletes.find(u => String(u.id) === String(id));
        
        setAthlete(foundAthlete || null);
        setSessions(Array.isArray(backendSessions) ? backendSessions : []);
        return;
      }
    } catch (err) {
      console.log("[WorkloadDetail] Backend fetch failed, falling back to local:", err.message);
    }

    // Fallback to local storage
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

  const { isWeb } = useResponsiveLayout();

  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webHeaderRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.webHeader}>{athlete.name} Workload Analysis</Text>
        </View>

        <View style={styles.webGrid}>
          {/* Left Column: Workload status */}
          <View style={styles.webLeftColumn}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>CUMULATIVE METRICS</Text>
              <Text style={[styles.value, { color, fontSize: 44, marginVertical: 10 }]}>
                {workloadLabel}
              </Text>
              <View style={styles.webStatsRow}>
                <View style={styles.webStatItem}>
                  <Text style={styles.webStatLabel}>Avg Fatigue</Text>
                  <Text style={styles.webStatVal}>{avgFatigue.toFixed(1)} / 10</Text>
                </View>
                <View style={styles.webStatItem}>
                  <Text style={styles.webStatLabel}>Avg Pace</Text>
                  <Text style={styles.webStatVal}>{avgPace.toFixed(1)} min/km</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column: Sessions */}
          <View style={styles.webRightColumn}>
            {/* Daily Performance */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>DAILY PERFORMANCE</Text>
              {todaySession ? (
                <View style={styles.webMetricGrid}>
                  <View style={styles.webMetricBox}>
                    <Text style={styles.webMetricLabel}>Pace</Text>
                    <Text style={styles.webMetricVal}>{todaySession.pace || "-"}</Text>
                  </View>
                  <View style={styles.webMetricBox}>
                    <Text style={styles.webMetricLabel}>Fatigue</Text>
                    <Text style={styles.webMetricVal}>{todaySession.fatigue || "-"}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.noData}>No session logged today</Text>
              )}
            </View>

            {/* Last Session */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>LAST LOGGED SESSION</Text>
              {lastSession ? (
                <View style={styles.webMetricGrid}>
                  <View style={styles.webMetricBox}>
                    <Text style={styles.webMetricLabel}>Date</Text>
                    <Text style={styles.webMetricVal}>{lastSession.date}</Text>
                  </View>
                  <View style={styles.webMetricBox}>
                    <Text style={styles.webMetricLabel}>Duration</Text>
                    <Text style={styles.webMetricVal}>{lastSession.duration || "-"} min</Text>
                  </View>
                  <View style={styles.webMetricBox}>
                    <Text style={styles.webMetricLabel}>Pace</Text>
                    <Text style={styles.webMetricVal}>{lastSession.pace || "-"}</Text>
                  </View>
                  <View style={styles.webMetricBox}>
                    <Text style={styles.webMetricLabel}>Fatigue</Text>
                    <Text style={styles.webMetricVal}>{lastSession.fatigue || "-"}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.noData}>No sessions recorded</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
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
  // Web Styles
  webContainer: {
    flex: 1,
    padding: 30,
    backgroundColor: '#0F172A',
  },
  webHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  webHeader: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  webGrid: {
    flexDirection: 'row',
    gap: 30,
  },
  webLeftColumn: {
    flex: 4,
  },
  webRightColumn: {
    flex: 6,
    gap: 20,
  },
  webStatsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  webStatItem: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  webStatLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  webStatVal: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  webMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  webMetricBox: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 14,
    padding: 14,
  },
  webMetricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  webMetricVal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
});
