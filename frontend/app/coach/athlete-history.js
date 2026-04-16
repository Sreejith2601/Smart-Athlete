import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, LayoutAnimation } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { 
  getAthletes, 
  getCPIMetrics, 
  getCPITrendMetrics, 
  getSmartInsights, 
  getTrainingComparison, 
  getActiveTrainingPlan 
} from "../../services/api";

export default function AthleteHistory() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [athlete, setAthlete] = useState(null);
  const [history, setHistory] = useState([]); 
  const [monthStats, setMonthStats] = useState({
    totalSessions: 0,
    avgRpe: "0",
    avgFatigue: "0",
    loadStatus: "",
    loadColor: "#22C55E",
  });
  const [cpiData, setCpiData] = useState(null);
  const [cpiTrend, setCpiTrend] = useState([]);
  const [insights, setInsights] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(false);
  const fetchLock = useRef(false);

  const loadData = useCallback(async () => {
    try {
      let currentAthlete = null;

      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const apiAthletes = await getAthletes(token);
          const mappedAthletes = (Array.isArray(apiAthletes) ? apiAthletes : []).map(u => ({ ...u, id: u._id }));
          currentAthlete = mappedAthletes.find((u) => String(u.id) === String(id));
          
          // Fetch Comparison Data
          const comparisonData = await getTrainingComparison(token, id);
          let timeline = [];
          
          if (comparisonData && comparisonData.timeline) {
            timeline = comparisonData.timeline;
            setHistory(timeline);
            setCompliance(comparisonData.summary);
          } else {
            setHistory([]);
            setCompliance(null);
          }

          // Month Stats calculation from actual sessions
          const now = new Date();
          const actualSessions = timeline.flatMap(d => d.actual || []);
          const monthSessions = actualSessions.filter((s) => {
            const d = new Date(s.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          });

          const totalSessions = monthSessions.length;
          const avgRpe = totalSessions > 0 ? (monthSessions.reduce((sum, s) => sum + Number(s.rpe || 0), 0) / totalSessions).toFixed(1) : "0";
          const avgFatigue = totalSessions > 0 ? (monthSessions.reduce((sum, s) => sum + Number(s.fatigue || 0), 0) / totalSessions).toFixed(1) : "0";

          let loadStatus = "READY FOR INTENSITY";
          let loadColor = "#22C55E";
          if (Number(avgFatigue) > 7) { loadStatus = "HIGH TRAINING LOAD"; loadColor = "#FF6B6B"; }
          else if (Number(avgFatigue) > 4) { loadStatus = "RECOVERING"; loadColor = "#F59E0B"; }

          setMonthStats({ totalSessions, avgRpe, avgFatigue, loadStatus, loadColor });

          // Analytics
          if (!fetchLock.current) {
            fetchLock.current = true;
            setAnalyticsLoading(true);
            setAnalyticsError(false);
            try {
              const [cpi, trend, insight, plan] = await Promise.all([
                getCPIMetrics(token, id),
                getCPITrendMetrics(token, id),
                getSmartInsights(token, id),
                getActiveTrainingPlan(token, id)
              ]);
              setCpiData(cpi);
              setCpiTrend(trend || []);
              setInsights(insight);
              setActivePlan(plan);
              setAnalyticsLoading(false);
              fetchLock.current = false;
            } catch (_err) {
              setAnalyticsError(true);
              setAnalyticsLoading(false);
              fetchLock.current = false;
            }
          }
        }
      } catch (error) {
        console.error("[AthleteHistory] API Error:", error.message);
      }

      if (!currentAthlete) {
        const usersData = await AsyncStorage.getItem("users");
        const users = usersData ? JSON.parse(usersData) : [];
        currentAthlete = users.find((u) => String(u.id) === String(id));
      }
      setAthlete(currentAthlete);

      setAthlete(currentAthlete);

    } catch (error) {
      console.log("Error loading history:", error);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateStr) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const chartWidth = Dimensions.get("window").width - 80;
  const chartHeight = 160;

  return (
    <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.athleteName}>{athlete?.name || "Athlete"}</Text>
            <Text style={styles.athleteSport}>{athlete?.sport || "Track & Field"}</Text>
          </View>
        </View>

        {/* 1. PERFORMANCE ANALYTICS ENGINE (TOP PRIORITY) */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.engineCard}>
          <Text style={styles.engineHeading}>PERFORMANCE ENGINE (CPI)</Text>
          
          {analyticsLoading ? (
            <View style={styles.loaderContainer}>
              <Text style={styles.loaderText}>Syncing metrics...</Text>
            </View>
          ) : (
            <>
              {/* Main CPI Score & Trend Area */}
              <View style={styles.cpiMetricRow}>
                <View>
                  <Text style={styles.cpiValueLarge}>{cpiData?.cpi || "--"}</Text>
                  <Text style={styles.cpiLabel}>CURRENT CPI</Text>
                </View>
                {cpiTrend && cpiTrend.length >= 2 && (
                   <View style={styles.trendIndicator}>
                      <Ionicons 
                        name={cpiTrend[cpiTrend.length-1].cpi >= cpiTrend[cpiTrend.length-2].cpi ? "trending-up" : "trending-down"} 
                        size={20} 
                        color={cpiTrend[cpiTrend.length-1].cpi >= cpiTrend[cpiTrend.length-2].cpi ? "#22C55E" : "#EF4444"} 
                      />
                      <Text style={[styles.trendPercent, { color: cpiTrend[cpiTrend.length-1].cpi >= cpiTrend[cpiTrend.length-2].cpi ? "#22C55E" : "#EF4444" }]}>
                        {Math.abs(((cpiTrend[cpiTrend.length-1].cpi - cpiTrend[cpiTrend.length-2].cpi) / cpiTrend[cpiTrend.length-2].cpi * 100).toFixed(1))}%
                      </Text>
                   </View>
                )}
              </View>

              {/* High-Fidelity Line Graph */}
              <View style={styles.chartContainer}>
                {cpiTrend && cpiTrend.length > 0 ? (
                  <View style={{ width: chartWidth, height: chartHeight }}>
                    {(() => {
                      const data = cpiTrend.slice(-6);
                      const maxVal = Math.max(...data.map(d => d.cpi), 100) + 5;
                      const minVal = Math.max(0, Math.min(...data.map(d => d.cpi)) - 5);
                      const range = maxVal - minVal || 1;
                      
                      const points = data.map((d, i) => ({
                        x: (i / (Math.max(1, data.length - 1))) * chartWidth,
                        y: chartHeight - ((d.cpi - minVal) / range) * chartHeight,
                        cpi: d.cpi
                      }));

                      return (
                        <>
                          {/* Grid Lines */}
                          <View style={[styles.gridLine, { top: 0 }]} />
                          <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
                          <View style={[styles.gridLine, { top: chartHeight, backgroundColor: 'rgba(255,255,255,0.1)' }]} />

                          {/* Line Segments */}
                          {points.map((p, i) => {
                            if (i === points.length - 1) return null;
                            const pnext = points[i+1];
                            const dx = pnext.x - p.x;
                            const dy = pnext.y - p.y;
                            const dist = Math.sqrt(dx*dx + dy*dy);
                            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                            
                            return (
                              <View 
                                key={`line-${i}`}
                                style={[styles.chartLine, {
                                  left: p.x + dx/2 - dist/2,
                                  top: p.y + dy/2,
                                  width: dist,
                                  transform: [{ rotate: `${angle}deg` }],
                                }]}
                              />
                            );
                          })}

                          {/* Data Points */}
                          {points.map((p, i) => (
                            <View key={`point-${i}`} style={[styles.chartPoint, { left: p.x - 4, top: p.y - 4 }]} />
                          ))}
                        </>
                      );
                    })()}
                  </View>
                ) : (
                  <Text style={styles.emptyChartText}>Insufficient data for trend visualization</Text>
                )}
              </View>

              {/* Component breakdown */}
              <View style={styles.scoresGrid}>
                <View style={styles.scoreBox}>
                   <Text style={styles.scoreVal}>{cpiData?.performanceScore || "--"}</Text>
                   <Text style={styles.scoreLabel}>PERF</Text>
                </View>
                <View style={[styles.scoreBox, styles.scoreBoxBorder]}>
                   <Text style={styles.scoreVal}>{cpiData?.efficiencyScore || "--"}</Text>
                   <Text style={styles.scoreLabel}>EFF</Text>
                </View>
                <View style={styles.scoreBox}>
                   <Text style={styles.scoreVal}>{cpiData?.loadScore || "--"}</Text>
                   <Text style={styles.scoreLabel}>LOAD</Text>
                </View>
              </View>

              {/* Breakthrough Insight */}
              {insights?.insight && (
                <View style={styles.insightPanel}>
                  <Text style={styles.insightTitle}>💡 AI BREAKTHROUGH INSIGHT</Text>
                  <Text style={styles.insightDescription}>{insights.insight}</Text>
                </View>
              )}
            </>
          )}
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Action FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push({ pathname: "/coach/create-plan", params: { athleteId: id } })}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    marginLeft: 16,
  },
  athleteName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  athleteSport: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  engineCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
    marginBottom: 20,
  },
  engineHeading: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
  },
  cpiMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cpiValueLarge: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '900',
  },
  cpiLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendPercent: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 4,
  },
  chartContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  chartLine: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#38BDF8',
    opacity: 0.8,
    shadowColor: '#38BDF8',
    shadowRadius: 10,
    shadowOpacity: 0.5,
  },
  chartPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  scoresGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    marginTop: 10,
  },
  scoreBox: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  scoreBoxBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  scoreVal: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '900',
  },
  scoreLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
  },
  insightPanel: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  insightTitle: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 6,
  },
  insightDescription: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  snapshotCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeading: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  complianceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  complianceValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  monthStatsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  monthStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 14,
  },
  monthStatVal: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: '900',
  },
  monthStatLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  bioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  bioItem: {
    width: (Dimensions.get("window").width - 92) / 2,
  },
  bioLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bioVal: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
  },
  descBlock: {
    marginTop: 20,
  },
  descText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  timelineItem: {
    marginBottom: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineDate: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '900',
  },
  plannedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  plannedTitle: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  actualCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actualType: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '800',
  },
  actualTime: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  actualStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  miniStatInline: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  miniStatBold: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  actualNote: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  loaderContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  }
});
