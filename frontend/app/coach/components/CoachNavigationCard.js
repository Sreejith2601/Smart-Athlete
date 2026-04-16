import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function CoachNavigationCard({ athleteCount, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.title}>My Athletes</Text>
      <Text style={styles.subtitle}>
        View and manage athlete profiles
      </Text>

      <View style={styles.footer}>
        <Text style={styles.count}>
          {athleteCount} Athletes
        </Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
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
    marginBottom: 16,
  },
  title: {
    color: "#1E293B",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  count: {
    color: "#38BDF8",
    fontWeight: "800",
    fontSize: 15,
  },
  arrow: {
    color: "#94A3B8",
    fontSize: 26,
    fontWeight: "700",
  },
});
