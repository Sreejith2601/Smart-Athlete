import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useEffect, useState, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTrainingByAthlete, getAthleteSessionHistory, getProfile } from "../../services/api";
import CalendarView from "../../components/CalendarView";
import { Ionicons } from "@expo/vector-icons";

/**
 * TrainingTimeline: A unified view of planned and completed sessions as a calendar.
 * Shades missed sessions in red and completed sessions with a green dot.
 */
export default function TrainingTimelineScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Fetch both plans (which includes missed/coached) and actual session history
        const [plans, history] = await Promise.all([
          getTrainingByAthlete(token),
          getAthleteSessionHistory(token)
        ]);

        // Merge them for the calendar view
        const merged = [
          ...Array.isArray(plans) ? plans : [],
          ...Array.isArray(history) ? history : []
        ];

        setData(merged);
      }
    } catch (error) {
      console.log("[Timeline] Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Consistency Summary (Adherence)
  const stats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthData = data.filter(s => {
      const d = new Date(s.date || s.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const planned = monthData.filter(d => d.status === 'pending' || d.status === 'active' || d.status === 'missed').length;
    const completed = monthData.filter(d => d.status === 'completed' || d.distance > 0).length;
    const missed = monthData.filter(d => d.status === 'missed').length;

    const score = planned > 0 ? Math.round((completed / (planned + completed - missed)) * 100) : 0;

    return { planned, completed, missed, score };
  }, [data]);

  if (loading) {
     return (
       <LinearGradient colors={["#FFF5F5", "#FFE4E1"]} style={styles.center}>
          <Text style={{color: '#94A3B8'}}>Loading Timeline...</Text>
       </LinearGradient>
     );
  }

  return (
    <LinearGradient colors={["#FFF5F5", "#FFE4E1"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Training Timeline</Text>

        {/* 1. The Smart Calendar Component */}
        <CalendarView 
          sessions={data} 
          onDateSelect={(key, daySessions) => setSelectedDateInfo({ key, daySessions })}
        />

        {/* 2. Consistency Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.cardTitle}>MONTHLY CONSISTENCY</Text>
              <Text style={{color: '#94A3B8', fontSize: 10}}>Training adherence score</Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{stats.score}%</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{stats.completed}</Text>
              <Text style={styles.statLab}>Done</Text>
            </View>
            <View style={[styles.statBox, styles.statBorder]}>
              <Text style={[styles.statVal, { color: '#FF6B6B' }]}>{stats.missed}</Text>
              <Text style={styles.statLab}>Missed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#38BDF8' }]}>{stats.planned}</Text>
              <Text style={styles.statLab}>Plans</Text>
            </View>
          </View>
        </View>

        {/* 3. Selected Date Details Section */}
        {selectedDateInfo && (
          <View style={styles.detailsContainer}>
             <Text style={styles.subHeader}>
                {selectedDateInfo.daySessions.length > 0 
                  ? `Sessions for ${selectedDateInfo.key.split('-').reverse().join('/')}`
                  : `No plans for ${selectedDateInfo.key.split('-').reverse().join('/')}`
                }
             </Text>
             {selectedDateInfo.daySessions.map((s, idx) => (
               <View key={idx} style={[styles.miniCard, s.status === 'missed' && styles.missedMini]}>
                  <View style={styles.miniCardTop}>
                    <Text style={styles.sessionType}>{s.trainingType}</Text>
                    {s.status === 'missed' && <View style={styles.missedTag}><Text style={styles.missedTagText}>MISSED</Text></View>}
                    {s.status === 'completed' && <Ionicons name="checkmark-circle" size={16} color="#22C55E" />}
                  </View>
                  <Text style={styles.miniCardText}>{s.mainWork || "Training Session"}</Text>
               </View>
             ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  header: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    color: "#475569",
    fontWeight: "800",
    letterSpacing: 1,
    fontSize: 11,
  },
  scoreBadge: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  statLab: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  subHeader: {
    fontSize: 15,
    color: "#475569",
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 12,
  },
  detailsContainer: {
    marginTop: 8,
  },
  miniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  missedMini: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.03)',
  },
  miniCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionType: {
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "800",
    textTransform: 'capitalize',
  },
  miniCardText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  missedTag: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  missedTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  }
});
