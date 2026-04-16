import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 7;

const CalendarView = ({ sessions = [], onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Group sessions/plans by date for quick lookup
  const dataMap = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const d = new Date(s.date || s.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

  const renderDays = () => {
    const days = [];
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    // Padding for first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayContainer} />);
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayKey = `${year}-${month}-${i}`;
      const dayData = dataMap[dayKey] || [];
      const isToday = dayKey === todayKey;
      
      const hasMissed = dayData.some(d => d.status === 'missed');
      const hasCompleted = dayData.some(d => d.status === 'completed' || d.distance > 0);

      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.dayContainer,
            hasMissed && !hasCompleted && styles.missedDay,
            isToday && styles.todayBorder
          ]}
          onPress={() => onDateSelect?.(dayKey, dayData)}
        >
          <Text style={[
            styles.dayText, 
            isToday && styles.todayText,
            (hasMissed && !hasCompleted) && styles.missedText
          ]}>
            {i}
          </Text>
          
          <View style={styles.indicatorRow}>
            {hasCompleted && <View style={styles.completedDot} />}
            {!hasCompleted && hasMissed && <Ionicons name="close-circle" size={8} color="#FF6B6B" />}
          </View>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const changeMonth = (offset) => {
    const newDate = new Date(year, month + offset, 1);
    setCurrentDate(newDate);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{monthNames[month]} {year}</Text>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week Header */}
      <View style={styles.weekHeader}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, index) => (
          <Text key={index} style={styles.weekDayText}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {renderDays()}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.completedDot} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#FFC0CB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    width: COLUMN_WIDTH,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: COLUMN_WIDTH,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderRadius: 12,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  todayBorder: {
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  todayText: {
    color: '#38BDF8',
    fontWeight: '900',
  },
  missedDay: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  missedText: {
    color: '#FF6B6B',
  },
  indicatorRow: {
    flexDirection: 'row',
    marginTop: 2,
    height: 8,
    alignItems: 'center',
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  legend: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  }
});

export default CalendarView;
