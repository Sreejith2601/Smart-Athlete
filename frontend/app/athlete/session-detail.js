import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function SessionDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    trainingType,
    date,
    duration,
    mainWork,
    intensity,
    fatigue,
    pulse,
    notes,
    status
  } = params;

  return (
    <LinearGradient
      colors={["#FFF5F5", "#FFE4E1", "#FFF5F5"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>Session Details</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, status === 'missed' ? styles.missedBadge : styles.completedBadge]}>
          <Text style={styles.statusText}>{status?.toUpperCase() || "COMPLETED"}</Text>
        </View>

        {/* Main Info Card */}
        <View style={styles.heroCard}>
          <Text style={styles.sessionType}>{trainingType || "General Training"}</Text>
          <Text style={styles.sessionDate}>{date ? new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "--"}</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{duration || "--"}m</Text>
              <Text style={styles.metricLabel}>Duration</Text>
            </View>
            <View style={[styles.metricBox, styles.borderLeft]}>
              <Text style={styles.metricValue}>{intensity || "--"}</Text>
              <Text style={styles.metricLabel}>Intensity</Text>
            </View>
            <View style={[styles.metricBox, styles.borderLeft]}>
              <Text style={styles.metricValue}>{pulse || "--"}</Text>
              <Text style={styles.metricLabel}>Avg HR</Text>
            </View>
          </View>
        </View>

        {/* Workout Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WORKOUT SUMMARY</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="run" size={20} color="#FF6B6B" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.detailLabel}>Main Work</Text>
                <Text style={styles.detailValue}>{mainWork || "No work details provided"}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="emoticon-neutral-outline" size={20} color="#FF6B6B" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.detailLabel}>Post-Session Fatigue</Text>
                <Text style={styles.detailValue}>{fatigue || "0"}/10</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COACH / ATHLETE NOTES</Text>
            <View style={styles.detailCard}>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: { color: '#1E293B', fontSize: 18, fontWeight: '800' },

  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  completedBadge: { backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: '#22c55e' },
  missedBadge: { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: '#ef4444' },
  statusText: { fontSize: 11, fontWeight: '800', color: '#1E293B' },

  heroCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    marginBottom: 24,
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  sessionType: { color: '#38BDF8', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  sessionDate: { color: '#64748B', fontSize: 13, marginTop: 4, marginBottom: 24, fontWeight: '600' },

  metricRow: { flexDirection: 'row', width: '100%', marginTop: 20 },
  metricBox: { flex: 1, alignItems: 'center' },
  borderLeft: { borderLeftWidth: 1, borderLeftColor: '#E2E8F0' },
  metricValue: { color: '#1E293B', fontSize: 18, fontWeight: '800' },
  metricLabel: { color: '#94A3B8', fontSize: 11, textTransform: 'uppercase', marginTop: 4, fontWeight: '700' },

  section: { marginBottom: 24 },
  sectionTitle: { color: '#64748B', fontSize: 12, fontWeight: '800', marginBottom: 12, letterSpacing: 1 },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  detailLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  detailValue: { color: '#1E293B', fontSize: 15, fontWeight: '800', marginTop: 2 },
  notesText: { color: '#475569', fontSize: 14, lineHeight: 22, fontWeight: '500' },
});
