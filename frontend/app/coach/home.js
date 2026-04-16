import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  TextInput,
  LayoutAnimation,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeInRight } from "react-native-reanimated";

import { 
  getAthletes, 
  getProfile, 
  getLiveActiveSessions, 
  getCPIMetrics, 
  getSmartInsights 
} from "../../services/api";
import { removeUser } from "../../utils/storage";

const { width } = Dimensions.get("window");

export default function CoachHome() {
  const router = useRouter();
  const [athletes, setAthletes] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [athleteMetrics, setAthleteMetrics] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Coach");
  const fetchStatus = useRef({});
  const pollingRef = useRef(null);

  // Dynamic Live Monitor State
  const [activeAthleteIndex, setActiveAthleteIndex] = useState(0);
  const [ticker, setTicker] = useState(Date.now());
  const timerRef = useRef(null);
  const rotationRef = useRef(null);

  const handleLogout = async () => {
    await removeUser();
    await AsyncStorage.removeItem("token");
    router.replace("/role-selection");
  };

  const loadData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // 1. Fetch Basic Info
      const [backendUser, athleteData, apiActive] = await Promise.all([
        getProfile(token),
        getAthletes(token),
        getLiveActiveSessions(token)
      ]);

      if (backendUser) {
        setUserName(backendUser.name || "Coach");
        if (backendUser.role && backendUser.role !== 'coach') {
          router.replace(`/${backendUser.role}/home`);
          return;
        }
      }

      const athleteUsers = (Array.isArray(athleteData) ? athleteData : []).map(u => ({
        ...u,
        id: u._id
      }));
      setAthletes(athleteUsers);

      const mappedActive = (Array.isArray(apiActive) ? apiActive : []).map(a => ({
        ...a,
        athleteId: String(a.athlete?._id || a.athlete)
      }));
      setActiveSessions(mappedActive);

      // 2. Fetch Metrics for each athlete
      athleteUsers.forEach(async (a) => {
        if (fetchStatus.current[a.id] === 'loading' || fetchStatus.current[a.id] === 'success') return;

        fetchStatus.current[a.id] = 'loading';
        try {
          const [cpiData, insightData] = await Promise.all([
            getCPIMetrics(token, a.id, "coach"),
            getSmartInsights(token, a.id, "coach")
          ]);

          fetchStatus.current[a.id] = 'success';
          setAthleteMetrics(prev => ({
            ...prev,
            [a.id]: {
              cpi: cpiData?.cpi || "--",
              insight: insightData?.insight || "Normal performance",
              loading: false
            }
          }));
        } catch (e) {
          fetchStatus.current[a.id] = 'error';
        }
      });

    } catch (error) {
      console.error("[CoachHome] Data load failed:", error.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
    pollingRef.current = setInterval(loadData, 10000);
    
    // Timer interval (1s)
    timerRef.current = setInterval(() => {
      setTicker(Date.now());
    }, 1000);

    // Rotation interval (5s)
    rotationRef.current = setInterval(() => {
      setActiveAthleteIndex(prev => {
        if (activeSessions.length <= 1) return 0;
        return (prev + 1) % activeSessions.length;
      });
    }, 5000);

    return () => {
      clearInterval(pollingRef.current);
      clearInterval(timerRef.current);
      clearInterval(rotationRef.current);
    };
  }, [loadData, activeSessions.length]);

  const formatDuration = (startTime) => {
    if (!startTime) return "00:00";
    const start = new Date(startTime).getTime();
    const diff = Math.max(0, ticker - start);
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useFocusEffect(useCallback(() => { 
    loadData(); 
  }, [loadData]));

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => 
      (a.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.sport || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [athletes, search]);

  const stats = useMemo(() => {
    const total = athletes.length;
    const tracking = activeSessions.length;
    return { total, tracking };
  }, [athletes, activeSessions]);


  return (
    <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Performance Hub</Text>
            <Text style={styles.coachName}>Coach {userName}</Text>
          </View>
        </Animated.View>

        {/* Squad Status Row */}
        <View style={styles.statCardsRow}>
           <Animated.View entering={FadeInRight.delay(200)} style={[styles.miniStat, { backgroundColor: '#38BDF815' }]}>
              <Text style={styles.miniStatVal}>{stats.total}</Text>
              <Text style={styles.miniStatLabel}>TOTAL SQUAD</Text>
           </Animated.View>

           {activeSessions.length > 0 ? (
             <Animated.View entering={FadeInRight.delay(300)} style={[styles.liveMonitorStat, { backgroundColor: '#22C55E15' }]}>
               <View style={styles.liveMonitorHeader}>
                 <View style={styles.liveDot} />
                 <Text style={styles.liveMonitorLabel}>LIVE NOW ({activeSessions.length})</Text>
               </View>
               
               <View style={styles.monitorContent}>
                 <Text style={styles.monitorAthleteName} numberOfLines={1}>
                   {(activeSessions[activeAthleteIndex]?.athlete?.name || "Athlete").toUpperCase()}
                 </Text>
                 <View style={styles.monitorFooter}>
                    <Text style={styles.monitorSlot}>{activeSessions[activeAthleteIndex]?.sessionSlot || "Training"}</Text>
                    <Text style={styles.monitorTimer}>{formatDuration(activeSessions[activeAthleteIndex]?.startTime)}</Text>
                 </View>
               </View>

               {activeSessions.length > 1 && (
                 <View style={styles.paginationDots}>
                   {activeSessions.map((_, i) => (
                     <View 
                       key={i} 
                       style={[styles.dot, i === activeAthleteIndex && styles.activeDot]} 
                     />
                   ))}
                 </View>
               )}
             </Animated.View>
           ) : (
             <Animated.View entering={FadeInRight.delay(300)} style={[styles.miniStat, { backgroundColor: '#22C55E15' }]}>
                <Text style={[styles.miniStatVal, { color: '#22C55E' }]}>0</Text>
                <Text style={styles.miniStatLabel}>LIVE NOW</Text>
             </Animated.View>
           )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search squad..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Athlete Cards List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SQUAD MANAGEMENT</Text>
        </View>

        {filteredAthletes.map((athlete, index) => {
          const isLive = activeSessions.some(s => s.athleteId === athlete.id);
          const metrics = athleteMetrics[athlete.id] || { cpi: "--", insight: "Gathering data..." };

          return (
            <Animated.View 
              key={athlete.id || index} 
              entering={FadeInUp.delay(100 + (index * 50))}
              style={[styles.card, isLive && styles.liveCard]}
            >
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => router.push({ pathname: "/coach/athlete-detail", params: { id: athlete.id } })}
              >
                <View style={styles.cardMain}>
                  <View style={styles.avatarContainer}>
                     <LinearGradient colors={["#38BDF8", "#3B82F6"]} style={styles.avatar}>
                        <Text style={styles.avatarText}>{(athlete.name || "A").charAt(0)}</Text>
                     </LinearGradient>
                     {isLive && <View style={styles.liveIndicator} />}
                  </View>
                  
                  <View style={styles.athleteInfo}>
                    <Text style={styles.athleteName}>{athlete.name || "Unknown Pupil"}</Text>
                    <Text style={styles.athleteSport}>{athlete.sport || "Athlete"}</Text>
                  </View>

                  <View style={styles.cpiContainer}>
                    <Text style={styles.cpiLabel}>CPI</Text>
                    <Text style={styles.cpiValue}>{metrics.cpi}</Text>
                  </View>
                </View>

                <View style={styles.quickInsight}>
                  <Ionicons name="trending-up" size={12} color="#94A3B8" />
                  <Text style={styles.insightText} numberOfLines={1}>{metrics.insight}</Text>
                </View>
              </TouchableOpacity>

              {/* Action Bar (Always visible at bottom of card) */}
              <View style={styles.actionBar}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => router.push({ pathname: "/coach/create-plan", params: { athleteId: athlete.id } })}
                >
                  <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
                  <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Plan</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => router.push({ pathname: "/coach/athlete-chat", params: { athleteId: athlete.id } })}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#8B5CF6" />
                  <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => router.push({ pathname: "/coach/athlete-history", params: { id: athlete.id } })}
                >
                  <Ionicons name="stats-chart-outline" size={18} color="#10B981" />
                  <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Analytics</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}

        {filteredAthletes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No athletes found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search criteria</Text>
          </View>
        )}

        {/* Global Workout / Team Actions ? (Optional but good for UX) */}
        
        {/* End of Dashboard Actions */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.footerActions}>
          <TouchableOpacity 
            style={styles.primaryLogoutBtn}
            onPress={handleLogout}
          >
            <LinearGradient 
              colors={["#EF4444", "#991B1B"]} 
              style={styles.logoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFF" />
              <Text style={styles.logoutBtnText}>LOGOUT</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.versionTag}>ATHLETE COMMAND CENTER • v2.0</Text>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  coachName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  statCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  miniStat: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
  },
  liveMonitorStat: {
    flex: 1.2,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    justifyContent: 'space-between',
  },
  liveMonitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  liveMonitorLabel: {
    color: "#22C55E",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  monitorContent: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 4,
  },
  monitorAthleteName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  monitorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  monitorSlot: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "600",
  },
  monitorTimer: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
    alignSelf: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  activeDot: {
    width: 12,
    backgroundColor: "#22C55E",
  },
  miniStatVal: {
    fontSize: 20,
    fontWeight: "900",
    color: "#38BDF8",
  },
  miniStatLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
  },
  liveCard: {
    borderColor: "rgba(34, 197, 94, 0.4)",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  liveIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  athleteInfo: {
    flex: 1,
    marginLeft: 14,
  },
  athleteName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  athleteSport: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },
  cpiContainer: {
    alignItems: "flex-end",
  },
  cpiLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "900",
  },
  cpiValue: {
    color: "#38BDF8",
    fontSize: 22,
    fontWeight: "900",
  },
  quickInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 16,
    opacity: 0.8,
  },
  insightText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
    fontStyle: "italic",
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.03)",
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderRightWidth: 0.5,
    borderRightColor: "rgba(255, 255, 255, 0.03)",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyTitle: {
    color: "#F1F5F9",
    fontSize: 18,
    fontWeight: "900",
  },
  emptySubtitle: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  footerActions: {
    marginTop: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryLogoutBtn: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  logoutGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoutBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  versionTag: {
    marginTop: 20,
    color: "#475569",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 3,
  }
});

