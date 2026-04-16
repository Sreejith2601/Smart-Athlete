import { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from '../utils/theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const performCleanup = async () => {
      try {
        await AsyncStorage.multiRemove(["users", "trainingSessions", "trainingPlans"]);
        console.log("[App Start] Cleaned up legacy AsyncStorage data");
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    };

    performCleanup();

    const timer = setTimeout(() => {
      router.replace('/role-selection');
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        {/* Glow layers */}
        <View style={styles.glowOuter} />
        <View style={styles.glowInner} />

        {/* Logo */}
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Text Section */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>SMART ATHLETE</Text>
        <Text style={styles.subtitle}>
          Train Smarter. Perform Better.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoContainer: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },

  glowOuter: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.secondary,
    opacity: 0.1,
  },

  glowInner: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },

  logo: {
    width: 160,
    height: 160,
    zIndex: 1,
  },

  textContainer: {
    alignItems: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 3,
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    textAlign: 'center',
    opacity: 0.8,
  },
});
