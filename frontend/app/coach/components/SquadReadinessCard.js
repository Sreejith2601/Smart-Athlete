import { View, Text, StyleSheet } from "react-native";

export default function SquadReadinessCard({
  readyCount,
  recoveryCount,
  inactiveCount,
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>TEAM READINESS</Text>

      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.readyValue}>{readyCount}</Text>
          <Text style={styles.label}>Healthy</Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.recoveryValue}>{recoveryCount}</Text>
          <Text style={styles.label}>At Risk</Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.inactiveValue}>{inactiveCount}</Text>
          <Text style={styles.label}>Inactive</Text>
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
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 20,
  },
  title: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 16,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  item: {
    alignItems: "center",
    flex: 1,
  },
  readyValue: {
    color: "#22C55E",
    fontSize: 28,
    fontWeight: "900",
  },
  recoveryValue: {
    color: "#FF6B6B",
    fontSize: 28,
    fontWeight: "900",
  },
  inactiveValue: {
    color: "#F59E0B",
    fontSize: 28,
    fontWeight: "900",
  },
  label: {
    color: "#64748B",
    marginTop: 6,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
