import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import WebSafeLineChart from '../../../components/WebSafeLineChart';

const screenWidth = Dimensions.get('window').width - 48; // Adjust for padding

export default function SquadTrendChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [4, 6, 5, 8, 7, 5, 4];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SQUAD FATIGUE PULSE</Text>
        <Text style={styles.subtitle}>Last 7 Days (Avg)</Text>
      </View>

      <WebSafeLineChart
        data={chartData}
        labels={labels}
        width={screenWidth}
        height={180}
        color="#38BDF8"
        labelColor="#64748B"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
});
