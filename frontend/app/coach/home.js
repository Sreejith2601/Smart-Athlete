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
import { useResponsiveLayout } from "../../utils/webStyles";

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


  const { isWeb } = useResponsiveLayout();

  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        {/* Top Header Row */}
        <View style={styles.webHeaderRow}>
          <View>
            <Text style={styles.webGreeting}>Performance Hub</Text>
            <Text style={styles.webCoachName}>Coach {userName}</Text>
          </View>
          
          {/* Header Stats Panel */}
          <View style={styles.webHeaderStats}>
            <View style={styles.webHeaderStatBox}>
              <Text style={styles.webHeaderStatVal}>{stats.total}</Text>
              <Text style={styles.webHeaderStatLabel}>SQUAD SIZE</Text>
            </View>
            <View style={[styles.webHeaderStatBox, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[styles.webHeaderStatVal, { color: '#22C55E' }]}>{activeSessions.length}</Text>
              <Text style={styles.webHeaderStatLabel}>ACTIVE NOW</Text>
            </View>
          </View>
        </View>

        {/* Dashboard Grid */}
        <View style={styles.webGrid}>
          {/* Left Panel: Squad List */}
          <View style={styles.webMainPanel}>
            <View style={styles.webSearchPanel}>
              <Ionicons name="search" size={20} color="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.webSearchInput}
                placeholder="Search athletes by name or sport..."
                placeholderTextColor="#64748B"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <View style={styles.webSectionHeader}>
              <Text style={styles.webSectionTitle}>SQUAD ROSTER</Text>
            </View>

            {/* Athlete Table/List on Web */}
            <View style={styles.webTableContainer}>
              {filteredAthletes.map((athlete, index) => {
                const isLive = activeSessions.some(s => s.athleteId === athlete.id);
                const metrics = athleteMetrics[athlete.id] || { cpi: "--", insight: "Gathering data..." };

                return (
                  <View key={athlete.id || index} style={[styles.webTableRow, isLive && styles.webTableRowLive]}>
                    {/* Athlete info */}
                    <View style={styles.webTableColInfo}>
                      <View style={styles.avatarContainer}>
                        <LinearGradient colors={["#38BDF8", "#3B82F6"]} style={styles.avatar}>
                          <Text style={styles.avatarText}>{(athlete.name || "A").charAt(0)}</Text>
                        </LinearGradient>
                        {isLive && <View style={styles.liveIndicator} />}
                      </View>
                      <View style={{ marginLeft: 14 }}>
                        <TouchableOpacity onPress={() => router.push({ pathname: "/coach/athlete-detail", params: { id: athlete.id } })}>
                          <Text style={styles.webAthleteName}>{athlete.name || "Unknown Athlete"}</Text>
                        </TouchableOpacity>
                        <Text style={styles.webAthleteSport}>{athlete.sport || "Athlete"}</Text>
                      </View>
                    </View>

                    {/* CPI Score */}
                    <View style={styles.webTableColCPI}>
                      <Text style={styles.webCPILabel}>CPI Score</Text>
                      <Text style={styles.webCPIVal}>{metrics.cpi}</Text>
                    </View>

                    {/* AI Smart Insight */}
                    <View style={styles.webTableColInsight}>
                      <Text style={styles.webInsightLabel}>LATEST INSIGHT</Text>
                      <Text style={styles.webInsightVal} numberOfLines={2}>{metrics.insight}</Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.webTableColActions}>
                      <TouchableOpacity 
                        style={[styles.webActionBtn, { borderColor: '#3B82F6' }]} 
                        onPress={() => router.push({ pathname: "/coach/create-plan", params: { athleteId: athlete.id } })}
                      >
                        <Ionicons name="calendar-outline" size={14} color="#3B82F6" />
                        <Text style={[styles.webActionBtnText, { color: '#3B82F6' }]}>Plan</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.webActionBtn, { borderColor: '#8B5CF6' }]} 
                        onPress={() => router.push({ pathname: "/coach/athlete-chat", params: { athleteId: athlete.id } })}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#8B5CF6" />
                        <Text style={[styles.webActionBtnText, { color: '#8B5CF6' }]}>Message</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.webActionBtn, { borderColor: '#10B981' }]} 
                        onPress={() => router.push({ pathname: "/coach/athlete-history", params: { id: athlete.id } })}
                      >
                        <Ionicons name="stats-chart-outline" size={14} color="#10B981" />
                        <Text style={[styles.webActionBtnText, { color: '#10B981' }]}>Analytics</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {filteredAthletes.length === 0 && (
                <View style={styles.webEmptyContainer}>
                  <Ionicons name="people-outline" size={48} color="#475569" />
                  <Text style={styles.webEmptyTitle}>No squad members found</Text>
                  <Text style={styles.webEmptySubtitle}>Adjust your search query above</Text>
                </View>
              )}
            </View>
          </View>

          {/* Right Panel: Live Monitoring Radar */}
          <View style={styles.webSidePanel}>
            <View style={styles.webLiveMonitorCard}>
              <View style={styles.webLiveMonitorHeader}>
                <View style={styles.liveDot} />
                <Text style={styles.webLiveMonitorTitle}>LIVE MONITORING RADAR</Text>
              </View>

              {activeSessions.length > 0 ? (
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  <View style={{ gap: 16 }}>
                    <View style={styles.webLiveAthleteRow}>
                      <View style={[styles.avatar, { width: 44, height: 44, backgroundColor: '#22C55E' }]}>
                        <Text style={styles.avatarText}>
                          {(activeSessions[activeAthleteIndex]?.athlete?.name || "A").charAt(0)}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.webLiveAthleteName}>
                          {activeSessions[activeAthleteIndex]?.athlete?.name}
                        </Text>
                        <Text style={styles.webLiveAthleteSession}>
                          {activeSessions[activeAthleteIndex]?.sessionSlot || "Active Workout"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.webLiveMetricBox}>
                      <Text style={styles.webLiveMetricLabel}>ELAPSED TIME</Text>
                      <Text style={styles.webLiveMetricValue}>
                        {formatDuration(activeSessions[activeAthleteIndex]?.startTime)}
                      </Text>
                    </View>

                    <View style={styles.webLiveMetricBox}>
                      <Text style={styles.webLiveMetricLabel}>HEART RATE STATUS</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Ionicons name="pulse" size={20} color="#FF6B6B" />
                        <Text style={[styles.webLiveMetricValue, { color: '#FF6B6B' }]}>
                          {activeSessions[activeAthleteIndex]?.currentHeartRate || "138"} BPM
                        </Text>
                      </View>
                    </View>
                  </View>

                  {activeSessions.length > 1 && (
                    <View style={styles.webLivePagination}>
                      <TouchableOpacity 
                        style={styles.webLivePageBtn}
                        onPress={() => setActiveAthleteIndex(prev => (prev - 1 + activeSessions.length) % activeSessions.length)}
                      >
                        <Ionicons name="chevron-back" size={16} color="#FFF" />
                      </TouchableOpacity>
                      <Text style={styles.webLivePageText}>
                        {activeAthleteIndex + 1} of {activeSessions.length}
                      </Text>
                      <TouchableOpacity 
                        style={styles.webLivePageBtn}
                        onPress={() => setActiveAthleteIndex(prev => (prev + 1) % activeSessions.length)}
                      >
                        <Ionicons name="chevron-forward" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.webLiveEmptyState}>
                  <Ionicons name="radio-outline" size={44} color="#475569" style={{ marginBottom: 12 }} />
                  <Text style={styles.webLiveEmptyText}>No active live sessions</Text>
                  <Text style={styles.webLiveEmptySub}>Athletes currently training will appear here in real-time.</Text>
                </View>
              )}
            </View>

            {/* Quick Actions Panel */}
            <View style={styles.webQuickActionsCard}>
              <Text style={styles.webQuickActionsTitle}>SYSTEM QUICK LINKS</Text>
              
              <TouchableOpacity 
                style={styles.webQuickLinkRow}
                onPress={() => router.push("/coach/workload")}
              >
                <Ionicons name="analytics" size={18} color="#FF6B6B" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.webQuickLinkLabel}>Workload Analysis</Text>
                  <Text style={styles.webQuickLinkDesc}>View cumulative fatigue and squad levels</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.webQuickLinkRow}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.webQuickLinkLabel, { color: '#EF4444' }]}>Terminate Session</Text>
                  <Text style={styles.webQuickLinkDesc}>Sign out of your dashboard profile</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

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
  },
  // Web styles
  webContainer: {
    flex: 1,
    padding: 30,
    backgroundColor: '#0F172A',
  },
  webHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  webGreeting: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  webCoachName: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  webHeaderStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  webHeaderStatBox: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webHeaderStatVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#38BDF8',
  },
  webHeaderStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 1,
  },
  webGrid: {
    flexDirection: 'row',
    gap: 30,
    flex: 1,
  },
  webMainPanel: {
    flex: 7,
    flexDirection: 'column',
  },
  webSearchPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  webSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webSectionHeader: {
    marginBottom: 16,
  },
  webSectionTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  webTableContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  webTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  webTableRowLive: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.02)',
  },
  webTableColInfo: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  webAthleteName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  webAthleteSport: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  webTableColCPI: {
    flex: 1.5,
    justifyContent: 'center',
  },
  webCPILabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  webCPIVal: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  webTableColInsight: {
    flex: 4,
    justifyContent: 'center',
    paddingRight: 10,
  },
  webInsightLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  webInsightVal: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 2,
  },
  webTableColActions: {
    flex: 3.5,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  webActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  webActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  webSidePanel: {
    flex: 3,
    flexDirection: 'column',
    gap: 24,
  },
  webLiveMonitorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    minHeight: 280,
  },
  webLiveMonitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  webLiveMonitorTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  webLiveAthleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webLiveAthleteName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  webLiveAthleteSession: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  webLiveMetricBox: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  webLiveMetricLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  webLiveMetricValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  webLivePagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  webLivePageBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webLivePageText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  webLiveEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  webLiveEmptyText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '800',
  },
  webLiveEmptySub: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  webQuickActionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    gap: 16,
  },
  webQuickActionsTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  webQuickLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  webQuickLinkLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  webQuickLinkDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  webEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 80,
  },
  webEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 12,
  },
  webEmptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
});

