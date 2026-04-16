import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCoaches, getChatMessages, sendChatMessage } from "../../services/api";

export default function CoachChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [coachId, setCoachId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchChatData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      // 1. Get coach (for simplicity, we grab the first coach in the system, or a specific assigned one if your logic later demands it)
      let currentCoachId = coachId;
      if (!currentCoachId) {
        const coaches = await getCoaches(token);
        if (coaches && coaches.length > 0) {
          currentCoachId = coaches[0]._id;
          setCoachId(currentCoachId);
        } else {
          setLoading(false);
          return; // No coaches found in system
        }
      }

      // 2. Fetch messages
      const msgs = await getChatMessages(token, currentCoachId);
      setMessages(msgs);
      setLoading(false);
    } catch (error) {
      console.error("[CoachChat] Failed to fetch chat:", error.message);
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    fetchChatData();
    // Simple polling for new messages every 3 seconds
    const interval = setInterval(() => {
      fetchChatData();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchChatData]);

  const handleSend = async () => {
    if (!input.trim() || !coachId) return;

    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    // Optimistically update UI
    const tempMsg = {
      _id: Date.now().toString(),
      sender: "me", // Placeholder to force right-side rendering
      text: input,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput("");

    try {
      await sendChatMessage(token, { receiverId: coachId, text: tempMsg.text });
      fetchChatData(); // Refresh to get real ID and avoid dupes
    } catch (error) {
      console.error("[CoachChat] Send failed:", error.message);
      alert("Failed to send message");
    }
  };

  const renderItem = ({ item }) => {
    // If the sender ID matches the coach ID, it's from the coach (left).
    // If we optimistically inserted it as "me" OR sender is NOT the coach, it's from the athlete (right).
    const isCoach = item.sender === coachId;
    
    return (
      <View
        style={[
          styles.message,
          isCoach ? styles.coachBubble : styles.athleteBubble,
        ]}
      >
        <Text style={[styles.messageText, isCoach ? { color: "#000" } : { color: "#fff" }]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#0f2f36", "#2f5a63"]} style={styles.container}>
      <Text style={styles.title}>COACH CHAT</Text>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#b7ff3c" />
        </View>
      ) : !coachId ? (
         <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#fff" }}>No coach assigned yet.</Text>
         </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  message: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    maxWidth: "75%",
  },
  coachBubble: {
    backgroundColor: "#ffffff",
    alignSelf: "flex-start",
  },
  athleteBubble: {
    backgroundColor: "#3b82f6",
    alignSelf: "flex-end",
  },
  messageText: {
    fontSize: 15,
  },
  inputRow: {
    position: "absolute",
    bottom: 10,
    left: 16,
    right: 16,
    flexDirection: "row",
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
});
