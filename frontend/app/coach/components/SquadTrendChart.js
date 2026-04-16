import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width - 48; // Adjust for padding

export default function SquadTrendChart({ data = [] }) {
  // Default data if none provided
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: data.length > 0 ? data : [4, 6, 5, 8, 7, 5, 4],
        color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`, // Sapphire Blue
        strokeWidth: 3
      }
    ],
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#38BDF8'
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid background lines
      stroke: 'rgba(226, 232, 240, 0.5)'
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SQUAD FATIGUE PULSE</Text>
        <Text style={styles.subtitle}>Last 7 Days (Avg)</Text>
      </View>
      
      <LineChart
        data={chartData}
        width={screenWidth}
        height={180}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withVerticalLines={false}
        withHorizontalLines={true}
        withDots={true}
        withShadow={false}
        withInnerLines={true}
        segments={4}
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: -10, // Fine-tuning alignment
  },
});
