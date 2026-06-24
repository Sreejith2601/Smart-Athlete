import { View, Text, StyleSheet, SectionList, TouchableOpacity, Platform } from "react-native";
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

  const isWeb = Platform.OS === 'web';

  if (isWeb) {
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
      <View style={styles.webContainer}>
        {/* Filter and Summary Row */}
        <View style={styles.webRowHeader}>
          <View style={styles.summaryCardWeb}>
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

          <View style={[styles.filterContainer, { marginBottom: 0, width: 220 }]}>
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
        </View>

        {/* Table representation on Web */}
        {sessions.length === 0 ? (
          <View style={styles.emptyCardWeb}>
            <Text style={styles.emptyText}>No sessions logged yet.</Text>
          </View>
        ) : (
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date / Slot</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Type</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Distance</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Duration</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Pace</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Pulse</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Fatigue</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Effort</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
            </View>

            {sessions.map((session, index) => {
              const isMissed = session.status === 'missed';
              return (
                <View key={session._id || index} style={[styles.tableRow, isMissed && styles.tableRowMissed]}>
                  <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '700' }]}>
                    {formatDate(session.createdAt || session.date)}
                    {"\n"}
                    <Text style={{ fontSize: 10, color: '#94A3B8', textTransform: 'capitalize' }}>{session.sessionSlot}</Text>
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2, color: '#FF6B6B', fontWeight: '800', textTransform: 'capitalize' }]}>
                    {session.trainingType}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {isMissed ? '--' : `${session.distance?.toFixed(1) || '0.0'} km`}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>
                    {session.duration} mins
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {isMissed ? '--' : (session.pace !== null && session.pace !== undefined ? `${session.pace.toFixed(1)} m/k` : 'N/A')}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {isMissed ? '--' : (session.pulse ? `${session.pulse} bpm` : 'N/A')}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {session.fatigue}/10
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.2, textTransform: 'capitalize' }]}>
                    {isMissed ? '--' : (session.effort || (session.rpe <= 4 ? "Easy" : session.rpe <= 7 ? "Moderate" : "Hard"))}
                  </Text>
                  <View style={[styles.tableCell, { flex: 1, justifyContent: 'center' }]}>
                    {isMissed ? (
                      <View style={[styles.missedTag, { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2 }]}>
                        <Text style={[styles.missedTagText, { fontSize: 8 }]}>MISSED</Text>
                      </View>
                    ) : (
                      <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' }}>
                        <Text style={{ color: '#22c55e', fontSize: 8, fontWeight: '900' }}>DONE</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  }

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
    cursor: "pointer",
  },
  filterBtnActive: {
    backgroundColor: '#FF6B6B',
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
    color: "#FF6B6B",
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
    color: "#FF6B6B",
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

  // Web Styles
  webContainer: {
    width: '100%',
  },
  webRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 20,
  },
  summaryCardWeb: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyCardWeb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
    borderColor: '#FFE4E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFE4E1',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#FFE4E1',
    paddingBottom: 12,
    marginBottom: 8,
  },
  tableHeaderCell: {
    color: '#64748B',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingVertical: 14,
  },
  tableRowMissed: {
    backgroundColor: '#FFF5F5',
  },
  tableCell: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
  },
});
