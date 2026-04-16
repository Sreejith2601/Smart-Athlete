import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function CoachCommunicationCard({ unreadCount, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={styles.title}>COMMUNICATION</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 
              ? `You have ${unreadCount} new messages` 
              : "Check in with your athletes"}
          </Text>
        </View>
        
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.actionBtn} 
        onPress={onPress}
      >
        <Text style={styles.actionText}>Open Chat</Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  badge: {
    backgroundColor: "#FF6B6B",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  actionBtn: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
  },
  actionText: {
    color: "#38BDF8",
    fontWeight: "800",
    fontSize: 14,
  },
});
