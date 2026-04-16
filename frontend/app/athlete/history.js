import { View, Text, StyleSheet, SectionList, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAthleteSessionHistory, getProfile, getCPIMetrics } from "../../services/api";

export default function TrainingHistory() {
  const [sessions, setSessions] = useState([]);
  const [weeklyCpi, setWeeklyCpi] = useState(null);
  const [filterMode, setFilterMode] = useState('week'); // 'week' | 'month'

  const loadSessions = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await getProfile(token);
        
        const data = await getAthleteSessionHistory(token);
        setSessions(Array.isArray(data) ? data : []);

        // Fetch CPI
        try {
          const cpiData = await getCPIMetrics(token);
          if (cpiData) setWeeklyCpi(cpiData.cpi);
        } catch (_e) {}
      }
    } catch (error) {
      console.log("Error loading sessions:", error);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const groupedSessions = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];
    
    const sorted = [...sessions].sort((a, b) => 
      new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
    );
    
    if (filterMode === 'week') {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diffToMonday));
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfWeek.getDate() - 7);

      const results = { thisWeek: [], lastWeek: [], older: [] };
      sorted.forEach(session => {
        const d = new Date(session.createdAt || session.date);
        if (d >= startOfWeek) results.thisWeek.push(session);
        else if (d >= startOfLastWeek) results.lastWeek.push(session);
        else results.older.push(session);
      });

      return [
        { title: "This Week", data: results.thisWeek },
        { title: "Last Week", data: results.lastWeek },
        { title: "Older", data: results.older }
      ].filter(g => g.data.length > 0);
    } else {
      // Monthly Grouping
      const groups = {};
      sorted.forEach(session => {
        const d = new Date(session.createdAt || session.date);
        const monthYear = d.toLocaleDateString("en-US", { month: 'long', year: 'numeric' });
        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push(session);
      });

      return Object.keys(groups).map(title => ({
        title,
        data: groups[title]
      }));
    }
  }, [sessions, filterMode]);

  return (
    <LinearGradient colors={["#FFF5F5", "#FFE4E1", "#FFF5F5"]} style={{ flex: 1 }}>
      <SectionList
        contentContainerStyle={styles.container}
        sections={groupedSessions}
        keyExtractor={(item, index) => item._id?.toString() || index.toString()}
        ListHeaderComponent={() => {
          const now = new Date();
          let filteredSessions = [];
          
          if (filterMode === 'week') {
            const day = now.getDay();
            const startOfWeek = new Date(now.setDate(now.getDate() - day + (day === 0 ? -6 : 1)));
            startOfWeek.setHours(0,0,0,0);
            filteredSessions = sessions.filter(s => new Date(s.date || s.createdAt) >= startOfWeek);
          } else {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredSessions = sessions.filter(s => new Date(s.date || s.createdAt) >= startOfLastMonth);
          }

          const totalDuration = filteredSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

          return (
            <View>
              <Text style={styles.header}>Training History</Text>
              
              {/* Filter Toggle */}
              <View style={styles.filterContainer}>
                <TouchableOpacity 
                  style={[styles.filterBtn, filterMode === 'week' && styles.filterBtnActive]}
                  onPress={() => setFilterMode('week')}
                >
                  <Text style={[styles.filterText, filterMode === 'week' && styles.filterTextActive]}>Weekly</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterBtn, filterMode === 'month' && styles.filterBtnActive]}
                  onPress={() => setFilterMode('month')}
                >
                  <Text style={[styles.filterText, filterMode === 'month' && styles.filterTextActive]}>Monthly</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{filteredSessions.length}</Text>
                  <Text style={styles.summaryLabel}>Sessions</Text>
                </View>
                <View style={[styles.summaryItem, styles.summaryBorder]}>
                  <Text style={styles.summaryValue}>{totalDuration}m</Text>
                  <Text style={styles.summaryLabel}>Total Duration</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: '#38BDF8' }]}>{weeklyCpi || "N/A"}</Text>
                  <Text style={styles.summaryLabel}>Avg CPI</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          sessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions logged yet.</Text>
          ) : null
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item: session }) => (
          <View style={[styles.card, session.status === "missed" && styles.missedCard]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.type}>
                {session.trainingType}
              </Text>
              {session.status === "missed" && (
                <View style={styles.missedTag}>
                  <Text style={styles.missedTagText}>MISSED</Text>
                </View>
              )}
            </View>

            {session.status === "missed" ? (
              <Text style={styles.missedText}>
                The session wasn&apos;t completed within the scheduled window.
              </Text>
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Ionicons name="location-outline" size={14} color="#64748B" />
                  <Text style={styles.text}>Dist: <Text style={styles.boldText}>{session.distance?.toFixed(1) || "0.0"} km</Text></Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={14} color="#64748B" />
                  <Text style={styles.text}>Dur: <Text style={styles.boldText}>{session.duration} mins</Text></Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="speedometer-outline" size={14} color="#64748B" />
                  <Text style={styles.text}>Pace: <Text style={styles.boldText}>{(session.pace !== null && session.pace !== undefined) ? `${session.pace.toFixed(1)} m/k` : "N/A"}</Text></Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="footsteps-outline" size={14} color="#64748B" />
                  <Text style={styles.text}>Steps: <Text style={styles.boldText}>{session.steps || 0}</Text></Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="heart-outline" size={14} color="#FF6B6B" />
                  <Text style={styles.text}>Pulse: <Text style={styles.boldText}>{session.pulse || "N/A"} bpm</Text></Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="flash-outline" size={14} color="#38BDF8" />
                  <Text style={styles.text}>Effort: <Text style={[styles.boldText, {textTransform: 'capitalize'}]}>
                    {session.effort || (session.rpe <= 4 ? "Easy" : session.rpe <= 7 ? "Moderate" : "Hard")}
                  </Text></Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
                  <Text style={styles.text}>Fatigue: <Text style={styles.boldText}>{session.fatigue}/10</Text></Text>
                </View>
              </View>
            )}

            <Text style={styles.date}>
              {formatDate(session.createdAt || session.date)} • {session.sessionSlot}
            </Text>
          </View>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterBtnActive: {
    backgroundColor: '#38BDF8',
  },
  filterText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: "#38BDF8",
    marginTop: 24,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
    paddingBottom: 4,
  },
  emptyText: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 40,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  missedCard: {
    borderColor: "#FF6B6B",
    borderWidth: 1.5,
  },
  type: {
    color: "#38BDF8",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  text: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
  },
  boldText: {
    color: '#1E293B',
    fontWeight: '800',
  },
  missedText: {
    color: "#64748B",
    fontStyle: "italic",
    marginBottom: 6,
    fontWeight: "500",
  },
  date: {
    color: "#94A3B8",
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700",
  },
  missedTag: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  missedTagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  summaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  summaryValue: {
    color: '#1E293B',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
