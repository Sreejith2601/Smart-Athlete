import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { removeUser } from '../utils/storage';

export default function WebLayout({ children, role }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.name || 'User');
        } else {
          // Try fetching from name direct if set
          const name = await AsyncStorage.getItem('userName');
          if (name) setUserName(name);
        }
      } catch (e) {
        console.error('Error fetching user for WebLayout:', e);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await removeUser();
    await AsyncStorage.removeItem('token');
    router.replace('/role-selection');
  };

  const athleteLinks = [
    { name: 'Dashboard', path: '/athlete/home', icon: 'home-outline', iconActive: 'home' },
    { name: 'Training Plans', path: '/athlete/training', icon: 'fitness-outline', iconActive: 'fitness' },
    { name: 'AI Daily Plan', path: '/athlete/daily-plan', icon: 'sparkles-outline', iconActive: 'sparkles' },
    { name: 'Session History', path: '/athlete/history', icon: 'time-outline', iconActive: 'time' },
    { name: 'Timeline', path: '/athlete/training-overview', icon: 'calendar-outline', iconActive: 'calendar' },
    { name: 'Coach Chat', path: '/athlete/coach-chat', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
    { name: 'My Profile', path: '/athlete/profile', icon: 'person-outline', iconActive: 'person' },
  ];

  const coachLinks = [
    { name: 'Dashboard', path: '/coach/home', icon: 'grid-outline', iconActive: 'grid' },
    { name: 'Workload Analysis', path: '/coach/workload', icon: 'analytics-outline', iconActive: 'analytics' },
    { name: 'Create Plan', path: '/coach/create-plan', icon: 'document-text-outline', iconActive: 'document-text' },
    { name: 'Athlete Chats', path: '/coach/athlete-chat', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  ];

  const links = role === 'coach' ? coachLinks : athleteLinks;

  // Determine current active page title
  const activeLink = links.find((link) => pathname.startsWith(link.path));
  const pageTitle = activeLink ? activeLink.name : 'Smart Athlete';

  return (
    <View style={styles.container}>
      {/* Sidebar navigation */}
      <View style={[styles.sidebar, isCollapsed ? styles.sidebarCollapsed : null]}>
        {/* Brand Logo Header */}
        <View style={styles.logoSection}>
          <Ionicons name="flash" size={28} color="#FF6B6B" />
          {!isCollapsed && <Text style={styles.logoText}>SMART <Text style={{ color: '#FF6B6B' }}>ATHLETE</Text></Text>}
        </View>

        {/* Collapsed Toggle Button */}
        <TouchableOpacity
          style={styles.collapseToggle}
          onPress={() => setIsCollapsed(!isCollapsed)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
            size={16}
            color="#FF6B6B"
          />
        </TouchableOpacity>

        {/* User profile card */}
        {!isCollapsed && (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</Text>
              <View style={styles.activeDot} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {userName || (role === 'coach' ? 'Coach' : 'Athlete')}
              </Text>
              <Text style={styles.profileRole}>
                {role === 'coach' ? 'Lead Coach' : 'Pro Athlete'}
              </Text>
            </View>
          </View>
        )}

        {/* Navigation items */}
        <ScrollView style={styles.navScroll} contentContainerStyle={styles.navContainer}>
          {links.map((link) => {
            const isActive = pathname.startsWith(link.path);
            const isHovered = hoveredLink === link.path;
            
            return (
              <TouchableOpacity
                key={link.path}
                style={[
                  styles.navItem,
                  isActive ? styles.navItemActive : null,
                  isHovered && !isActive ? styles.navItemHovered : null,
                  isCollapsed ? styles.navItemCollapsed : null,
                ]}
                onPress={() => router.push(link.path)}
                onMouseEnter={() => setHoveredLink(link.path)}
                onMouseLeave={() => setHoveredLink(null)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isActive ? link.iconActive : link.icon}
                  size={20}
                  color={isActive ? '#FFFFFF' : isHovered ? '#FF6B6B' : '#64748B'}
                />
                {!isCollapsed && (
                  <Text style={[styles.navText, isActive ? styles.navTextActive : isHovered ? styles.navTextHovered : null]}>
                    {link.name}
                  </Text>
                )}
                {isActive && !isCollapsed && (
                  <View style={styles.activeIndicator} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer actions */}
        <View style={styles.sidebarFooter}>
          <TouchableOpacity
            style={[styles.logoutBtn, isCollapsed ? styles.logoutBtnCollapsed : null]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            {!isCollapsed && <Text style={styles.logoutText}>Sign Out</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Workspace Area */}
      <View style={styles.workspace}>
        {/* Top Navbar */}
        <View style={styles.topNavbar}>
          <View style={styles.navbarLeft}>
            <Text style={styles.navbarTitle}>{pageTitle}</Text>
          </View>
          <View style={styles.navbarRight}>
            {/* Quick stats indicator */}
            <View style={styles.navbarBadge}>
              <View style={styles.statusPulse} />
              <Text style={styles.badgeText}>Connected to AI Engine</Text>
            </View>

            {/* Notification btn */}
            <TouchableOpacity style={styles.navbarIconBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color="#64748B" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navbarProfileBtn}
              onPress={() => router.push(role === 'coach' ? '/coach/home' : '/athlete/profile')}
              activeOpacity={0.7}
            >
              <View style={styles.navbarAvatar}>
                <Text style={styles.navbarAvatarText}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Page Content Scroll container */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#FFF5F5',
  },
  sidebar: {
    width: 260,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRightWidth: 1,
    borderRightColor: '#FFE4E1',
    flexDirection: 'column',
    position: 'relative',
    transition: 'width 0.2s ease-in-out',
  },
  sidebarCollapsed: {
    width: 70,
  },
  logoSection: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4E1',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 1,
  },
  collapseToggle: {
    position: 'absolute',
    right: -12,
    top: 25,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE4E1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    cursor: 'pointer',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  profileRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  navScroll: {
    flex: 1,
  },
  navContainer: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 0.2s',
  },
  navItemActive: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  navItemHovered: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  navTextActive: {
    color: '#FFFFFF',
  },
  navTextHovered: {
    color: '#FF6B6B',
  },
  activeIndicator: {
    position: 'absolute',
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFE4E1',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    cursor: 'pointer',
  },
  logoutBtnCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  workspace: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
  },
  topNavbar: {
    height: 70,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  navbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navbarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navbarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  statusPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  navbarIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
  },
  notificationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
    position: 'absolute',
    top: 10,
    right: 10,
  },
  navbarProfileBtn: {
    cursor: 'pointer',
  },
  navbarAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE4E1',
    borderWidth: 1,
    borderColor: '#FFD1D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navbarAvatarText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '800',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexGrow: 1,
  },
});
