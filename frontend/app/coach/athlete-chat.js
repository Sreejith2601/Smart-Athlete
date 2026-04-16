import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInUp, SlideInRight, SlideInLeft } from "react-native-reanimated";
import { getChatMessages, sendChatMessage, getAthletes } from "../../services/api";

export default function AthleteChat() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [athleteName, setAthleteName] = useState("Athlete");
  const [myId, setMyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchChatData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token || !id) {
        setLoading(false);
        return;
      }

      if (!myId) {
        const userStr = await AsyncStorage.getItem("currentUser");
        if (userStr) {
          const user = JSON.parse(userStr);
          setMyId(user._id || user.id);
        }
      }

      if (athleteName === "Athlete") {
        const athletes = await getAthletes(token);
        const found = (Array.isArray(athletes) ? athletes : []).find(
          (a) => String(a._id) === String(id)
        );
        if (found) setAthleteName(found.name);
      }

      const msgs = await getChatMessages(token, id);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setLoading(false);
    } catch (error) {
      console.error("[AthleteChat] Failed to fetch chat:", error.message);
      setLoading(false);
    }
  }, [id, myId, athleteName]);

  useEffect(() => {
    fetchChatData();
    const interval = setInterval(() => {
      fetchChatData();
    }, 5000); // Slightly slower polling for battery efficiency
    return () => clearInterval(interval);
  }, [fetchChatData]);

  const handleSend = async () => {
    if (!input.trim() || !id) return;

    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    const tempMsg = {
      _id: Date.now().toString(),
      sender: myId || "me",
      text: input,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput("");

    try {
      await sendChatMessage(token, { receiverId: id, text: tempMsg.text });
      fetchChatData();
    } catch (error) {
      console.error("[AthleteChat] Send failed:", error.message);
    }
  };

  const renderItem = ({ item, index }) => {
    const isAthlete = String(item.sender) === String(id);

    return (
      <Animated.View
        entering={isAthlete ? SlideInLeft : SlideInRight}
        style={[
          styles.message,
          isAthlete ? styles.athleteBubble : styles.coachBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isAthlete ? { color: "#E2E8F0" } : { color: "#FFFFFF" },
          ]}
        >
          {item.text}
        </Text>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#38BDF8" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.avatar}>
               <LinearGradient colors={["#38BDF8", "#3B82F6"]} style={styles.avatarGradient}>
                 <Text style={styles.avatarText}>{athleteName.charAt(0).toUpperCase()}</Text>
               </LinearGradient>
            </View>
            <View>
              <Text style={styles.headerName}>{athleteName}</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.headerStatus}>Athlete Terminal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#38BDF8" />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputArea}>
          <View style={styles.inputGlass}>
            <TextInput
              style={styles.input}
              placeholder="Secure directive..."
              placeholderTextColor="#64748B"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <LinearGradient colors={["#38BDF8", "#3B82F6"]} style={styles.sendIconContainer}>
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.15)",
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 18,
  },
  headerName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  headerStatus: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  message: {
    padding: 16,
    borderRadius: 22,
    marginBottom: 12,
    maxWidth: "85%",
  },
  athleteBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderBottomLeftRadius: 4,
  },
  coachBubble: {
    backgroundColor: "#3B82F6",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  messageText: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  inputArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'transparent',
  },
  inputGlass: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
  },
  sendIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
