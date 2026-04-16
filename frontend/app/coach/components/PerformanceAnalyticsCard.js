import { View, Text, StyleSheet } from "react-native";

export default function PerformanceAnalyticsCard({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>PERFORMANCE</Text>
        <Text style={styles.noData}>No training data yet</Text>
      </View>
    );
  }

  // Take last 7 sessions
  const recent = [...sessions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);

  const avgFatigue =
    recent.reduce((sum, s) => sum + (Number(s.fatigue) || 0), 0) /
    recent.length;

  const avgPace =
    recent.reduce((sum, s) => sum + (Number(s.pace) || 0), 0) /
    recent.length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>PERFORMANCE</Text>

      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.value}>
            {avgPace.toFixed(1)}
          </Text>
          <Text style={styles.label}>Avg Pace</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.value}>
            {avgFatigue.toFixed(1)}
          </Text>
          <Text style={styles.label}>Avg Fatigue</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 20,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  metric: {
    alignItems: "center",
  },
  value: {
    color: "#1E293B",
    fontSize: 32,
    fontWeight: "900",
  },
  label: {
    color: "#64748B",
    marginTop: 6,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  noData: {
    color: "#94A3B8",
    marginTop: 10,
    fontStyle: "italic",
    fontWeight: "600",
  },
});
