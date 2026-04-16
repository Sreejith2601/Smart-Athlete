import { View, Text, StyleSheet } from "react-native";

export default function AthleteWellnessItem({ name, score, status }) {
  const getColor = () => {
    if (status === "red") return "#FF6B6B";
    if (status === "yellow") return "#F59E0B";
    return "#22C55E";
  };

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.score}>{score}/10</Text>
      </View>

      <View
        style={[
          styles.statusBar,
          { backgroundColor: getColor() },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 16,
  },
  info: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  name: {
    color: "#1E293B",
    fontWeight: "800",
    fontSize: 15,
  },
  score: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 13,
  },
  statusBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F1F5F9",
  },
});
