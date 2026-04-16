import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ActivityFeedItem({ activity, onPress }) {
  const getIcon = (type) => {
    switch (type) {
      case 'session_completed': return 'checkmark-done-circle';
      case 'missed': return 'close-circle';
      case 'high_fatigue': return 'flash';
      case 'injury': return 'bandage';
      default: return 'notifications';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'session_completed': return '#22C55E';
      case 'missed': return '#EF4444';
      case 'high_fatigue': return '#F59E0B';
      case 'injury': return '#D946EF';
      default: return '#64748B';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: `${getColor(activity.type)}15` }]}>
        <Ionicons name={getIcon(activity.type)} size={20} color={getColor(activity.type)} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.athleteName}>{activity.athleteName}</Text>
          <Text style={styles.time}>{activity.timeAgo}</Text>
        </View>
        <Text style={styles.message} numberOfLines={1}>
          {activity.message}
        </Text>
      </View>
      
      {activity.rpe && (
        <View style={styles.rpeBadge}>
          <Text style={styles.rpeLabel}>RPE</Text>
          <Text style={styles.rpeValue}>{activity.rpe}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  athleteName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  time: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  rpeBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  rpeLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  rpeValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0EA5E9',
  },
});
