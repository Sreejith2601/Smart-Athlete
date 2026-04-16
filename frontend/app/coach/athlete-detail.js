import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { getAthletes, getTrainingComparison } from "../../services/api";

export default function AthleteDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [athlete, setAthlete] = useState(null);
  const [history, setHistory] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const [apiAthletes, comparisonData] = await Promise.all([
        getAthletes(token),
        getTrainingComparison(token, id)
      ]);

      const mappedAthletes = (Array.isArray(apiAthletes) ? apiAthletes : []).map(u => ({ ...u, id: u._id }));
      const currentAthlete = mappedAthletes.find((u) => String(u.id) === String(id));
      setAthlete(currentAthlete);

      if (comparisonData && comparisonData.timeline) {
        setHistory(comparisonData.timeline);
        setCompliance(comparisonData.summary);
      }
    } catch (error) {
      console.error("[AthleteDetail] Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateStr) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.loaderContainer}>
        <Text style={styles.loaderText}>Loading athlete profile...</Text>
      </LinearGradient>
    );
  }

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

        {/* 1. ADHERENCE / COMPLIANCE */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.card}>
           <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionHeading}>ADHERENCE SNAPSHOT</Text>
              {compliance && (
                <View style={[styles.complianceBadge, {backgroundColor: compliance.color + '20', borderColor: compliance.color}]}>
                  <Text style={[styles.complianceValue, {color: compliance.color}]}>{compliance.score}%</Text>
                </View>
              )}
           </View>
           <Text style={styles.complianceNote}>
             {compliance?.score > 80 ? "Excellent consistency. Ready for advanced loading." : "Inconsistent adherence. Review recovery windows."}
           </Text>
        </Animated.View>

        {/* 2. ATHLETE PROFILE (BIO) */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.glassCard}>
           <Text style={styles.sectionHeading}>PERSONAL BIOMETRICS</Text>
           <View style={styles.bioGrid}>
              <View style={styles.bioItem}>
                <Text style={styles.bioLabel}>GENDER / AGE</Text>
                <Text style={styles.bioVal}>{athlete?.profile?.gender || "N/A"} / {athlete?.profile?.age || "--"}</Text>
              </View>
              <View style={styles.bioItem}>
                <Text style={styles.bioLabel}>HEIGHT / WEIGHT</Text>
                <Text style={styles.bioVal}>{athlete?.profile?.height || "--"}cm / {athlete?.profile?.weight || "--"}kg</Text>
              </View>
              <View style={styles.bioItem}>
                <Text style={styles.bioLabel}>BLOOD GROUP</Text>
                <Text style={styles.bioVal}>{athlete?.profile?.bloodGroup || "N/A"}</Text>
              </View>
              <View style={styles.bioItem}>
                <Text style={styles.bioLabel}>LOCATION</Text>
                <Text style={styles.bioVal}>{athlete?.profile?.city || "Unknown"}</Text>
              </View>
           </View>
           
           <View style={styles.descBlock}>
              <Text style={styles.bioLabel}>COACH NOTES & HISTORY</Text>
              <Text style={styles.descText}>{athlete?.profile?.pastHistory || "No additional records."}</Text>
           </View>
        </Animated.View>

        {/* 3. TRAINING TIMELINE */}
        <View style={styles.dividerContainer}>
           <View style={styles.dividerLine} />
           <Text style={styles.dividerText}>TRAINING HISTORY</Text>
           <View style={styles.dividerLine} />
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent training activity logged.</Text>
          </View>
        ) : (
          history.map((day, idx) => (
            <View key={day.date} style={styles.timelineItem}>
              <View style={styles.timelineHeader}>
                 <View style={[styles.dot, { backgroundColor: day.status === "completed" ? "#22C55E" : day.status === "missed" ? "#EF4444" : "#64748B" }]} />
                 <Text style={styles.timelineDate}>{formatDate(day.date)}</Text>
                 <View style={[styles.statusTag, { backgroundColor: day.status === "completed" ? "#22C55E20" : day.status === "missed" ? "#EF444420" : "#64748B20" }]}>
                   <Text style={[styles.statusTagText, { color: day.status === "completed" ? "#22C55E" : day.status === "missed" ? "#EF4444" : "#64748B" }]}>{day.status.toUpperCase()}</Text>
                 </View>
              </View>

              {day.planned.map(p => (
                <View key={`p-${p._id || p.id}`} style={styles.plannedRow}>
                   <Ionicons name="calendar-outline" size={14} color="#38BDF8" />
                   <Text style={styles.plannedTitle}>PLANNED: {p.trainingType}</Text>
                </View>
              ))}

              {day.actual.map(s => (
                <View key={`s-${s._id || s.id}`} style={styles.actualCard}>
                   <View style={styles.actualHeader}>
                      <Text style={styles.actualType}>{s.trainingType}</Text>
                      <Text style={styles.actualTime}>{new Date(s.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Text>
                   </View>
                   <View style={styles.actualStats}>
                      <Text style={styles.miniStatInline}>Dist: <Text style={styles.miniStatBold}>{s.distance?.toFixed(1) || "0.0"}km</Text></Text>
                      <Text style={styles.miniStatInline}>Dur: <Text style={styles.miniStatBold}>{s.duration || "0"}min</Text></Text>
                      <Text style={styles.miniStatInline}>RPE: <Text style={styles.miniStatBold}>{s.rpe || "0"}</Text></Text>
                   </View>
                   {s.feedback && <Text style={styles.actualNote}>"{s.feedback}"</Text>}
                </View>
              ))}
            </View>
          ))
        )}

        {/* CTA to Analytics */}
        <TouchableOpacity 
          style={styles.analyticsCTA}
          onPress={() => router.push({ pathname: "/coach/athlete-history", params: { id } })}
        >
          <Text style={styles.analyticsCTAText}>VIEW CPI PERFORMANCE ENGINE</Text>
          <Ionicons name="chevron-forward" size={16} color="#38BDF8" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    marginLeft: 16,
  },
  athleteName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
  athleteSport: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  complianceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  complianceValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  complianceNote: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
  },
  bioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 20,
  },
  bioItem: {
    width: (Dimensions.get("window").width - 100) / 2,
  },
  bioLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  bioVal: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
  },
  descBlock: {
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  descText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  timelineItem: {
    marginBottom: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineDate: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '900',
  },
  plannedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    marginBottom: 10,
    gap: 10,
  },
  plannedTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  actualCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  actualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actualType: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '800',
  },
  actualTime: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  actualStats: {
    flexDirection: 'row',
    gap: 20,
  },
  miniStatInline: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  miniStatBold: {
    color: '#F1F5F9',
    fontWeight: '800',
  },
  actualNote: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },
  analyticsCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingVertical: 15,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    gap: 10,
  },
  analyticsCTAText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
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
