import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import AthleteWellnessItem from "./AthleteWellnessItem";

export default function AthleteWellnessList({ athletes, getLastSession }) {
  const [expanded, setExpanded] = useState(false);

  const getStatus = (session) => {
    if (!session) return "yellow";

    const fatigue = Number(session.fatigue) || 0;

    if (fatigue >= 8) return "red";
    if (fatigue >= 5) return "yellow";
    return "green";
  };

  const getScore = (session) => {
    if (!session) return "-";
    const fatigue = Number(session.fatigue) || 0;
    return (10 - fatigue).toFixed(1);
  };

  const displayedAthletes = expanded
    ? athletes
    : athletes.slice(0, 2);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>ATHLETE WELLNESS</Text>

      {displayedAthletes.map((athlete) => {
        const session = getLastSession(athlete);
        return (
          <AthleteWellnessItem
            key={athlete.id}
            name={athlete.name}
            score={getScore(session)}
            status={getStatus(session)}
          />
        );
      })}

      {athletes.length > 2 && (
        <Text
          style={styles.viewMore}
          onPress={() => setExpanded(!expanded)}
        >
          {expanded ? "Show Less" : "View All"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 20,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  viewMore: {
    color: "#38BDF8",
    marginTop: 12,
    fontWeight: "800",
    fontSize: 14,
    textAlign: "center",
  },
});
