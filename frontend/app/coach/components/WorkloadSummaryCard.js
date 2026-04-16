import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function WorkloadSummaryCard({ athletes, sessions }) {
  const router = useRouter();
  
  // Calculate average fatigue across all athletes based on recent sessions
  let totalFatigue = 0;
  let count = 0;

  // ACWR Mock Calculation / Concept for professional display
  // Real ACWR would require 28 days of data, we approximate with what we have
  const calculateACWR = () => {
    if (!sessions || sessions.length === 0) return 1.0;
    
    // Sort sessions by date
    const sorted = [...sessions].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    // Last 7 days vs Average
    const acute = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.2)));
    const acuteAvg = acute.reduce((sum, s) => sum + (Number(s.rpe || 5) * Number(s.duration || 30)), 0) / acute.length;
    
    const chronicAvg = sorted.reduce((sum, s) => sum + (Number(s.rpe || 5) * Number(s.duration || 30)), 0) / sorted.length;
    
    const ratio = acuteAvg / chronicAvg;
    return isNaN(ratio) ? 1.0 : parseFloat(ratio.toFixed(2));
  };

  const acwr = calculateACWR();
  
  // Overall team fatigue
  athletes.forEach((athlete) => {
    const athleteSessions = (sessions || []).filter(s => String(s.athlete) === String(athlete._id));
    const lastSession = athleteSessions.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
    
    if (lastSession && lastSession.fatigue) {
      totalFatigue += Number(lastSession.fatigue);
      count++;
    }
  });

  const avgFatigue = count > 0 ? totalFatigue / count : 0;

  let statusLabel = "Optimal";
  let statusColor = "#22C55E"; // Emerald

  if (acwr > 1.5 || avgFatigue >= 8) {
    statusLabel = "At Risk";
    statusColor = "#EF4444"; // Crimson
  } else if (acwr > 1.3 || avgFatigue >= 6) {
    statusLabel = "Warning";
    statusColor = "#F59E0B"; // Amber
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push("/coach/workload")}
    >
      <View style={styles.header}>
        <Text style={styles.title}>WORKLOAD MONITOR</Text>
        <Ionicons name="analytics" size={16} color="#38BDF8" />
      </View>

      <View style={styles.content}>
        <View style={styles.mainMetric}>
          <Text style={[styles.statusValue, { color: statusColor }]}>
            {statusLabel}
          </Text>
          <Text style={styles.subText}>Team Average</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.secondaryMetric}>
          <Text style={styles.acwrValue}>{acwr}</Text>
          <Text style={styles.acwrLabel}>ACWR RATIO</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressBarBg}>
           <View style={[styles.progressBarFill, { width: `${Math.min(100, (acwr/2)*100)}%`, backgroundColor: statusColor }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainMetric: {
    flex: 1,
  },
  statusValue: {
    fontSize: 28,
    fontWeight: "900",
  },
  subText: {
    color: "#64748B",
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 15,
  },
  secondaryMetric: {
    alignItems: "center",
  },
  acwrValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1E293B",
  },
  acwrLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  footer: {
    marginTop: 18,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
});
