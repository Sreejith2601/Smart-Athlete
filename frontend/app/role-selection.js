import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { useResponsiveLayout } from '../utils/webStyles';

export default function RoleSelection() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { isWide } = useResponsiveLayout();

  const selectRole = (role) => {
    router.push({
      pathname: '/(auth)/login',
      params: { role },
    });
  };

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = (role) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start(() => selectRole(role));
  };

  return (
    <LinearGradient
      colors={['#FFE2D1', '#FFD1D1', '#FFE5F1']} // Energetic Pastel Sunrise
      style={styles.container}
    >
      {/* Content Wrapper */}
      <View style={styles.contentWrapper}>
        {/* Top Section */}
        <View style={styles.topSection}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Smart AI Sports Companion
          </Text>
        </View>

        {/* Card Section */}
        <View style={[styles.cardSection, isWide && styles.cardSectionWide]}>

          {/* Athlete Card */}
          <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, isWide && { flex: 1 }]}>
            <TouchableOpacity
              style={[styles.card, isWide && styles.cardWide]}
              activeOpacity={0.9}
              onPressIn={onPressIn}
              onPressOut={() => onPressOut('athlete')}
            >
              <Image
                source={require('../assets/athlete.png')}
                style={styles.icon}
                resizeMode="contain"
              />
              <Text style={styles.cardText}>ATHLETE</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Coach Card */}
          <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, isWide && { flex: 1 }]}>
            <TouchableOpacity
              style={[styles.card, isWide && styles.cardWide]}
              activeOpacity={0.9}
              onPressIn={onPressIn}
              onPressOut={() => onPressOut('coach')}
            >
              <Image
                source={require('../assets/coach.png')}
                style={styles.icon}
                resizeMode="contain"
              />
              <Text style={styles.cardText}>COACH</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFE2D1',
  },

  contentWrapper: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 40,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },

  topSection: {
    alignItems: 'center',
    marginBottom: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },

  cardSection: {
    width: '100%',
  },

  cardSectionWide: {
    flexDirection: 'row',
    gap: 24,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },

  card: {
    width: '100%',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // Frosted Glass
    borderRadius: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',

    shadowColor: '#FF9A9E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },

  cardWide: {
    marginBottom: 0,
    minHeight: 240,
    justifyContent: 'center',
    cursor: 'pointer',
  },

  icon: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },

  cardText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
});
