import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const menuItems = [
    { icon: '🔔', label: 'Notifications' },
    { icon: '🎨', label: 'Appearance' },
    { icon: '📤', label: 'Export Data' },
    { icon: '❓', label: 'Help & Support' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}><Text style={styles.title}>Profile</Text></View>
        <View style={styles.userCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || '?'}</Text></View>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userSince}>Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
          </View>
        </View>
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={item.label} style={[styles.menuItem, index === menuItems.length - 1 && styles.menuItemLast]}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Front Row</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  title: { fontFamily: FONTS.bold, fontSize: 32, color: COLORS.navy },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.navy, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  avatarText: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xl, color: COLORS.cream },
  userInfo: { flex: 1 },
  userEmail: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.md, color: COLORS.navy },
  userSince: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.gray, marginTop: SPACING.xs },
  menuSection: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, marginBottom: SPACING.xl, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.creamDark },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { fontSize: 20, marginRight: SPACING.md },
  menuLabel: { flex: 1, fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy },
  menuArrow: { fontSize: FONT_SIZES.xl, color: COLORS.gray },
  signOutButton: { backgroundColor: COLORS.error, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', marginBottom: SPACING.xl },
  signOutText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.white },
  appInfo: { alignItems: 'center' },
  appName: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.lg, color: COLORS.navy },
  appVersion: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.gray, marginTop: SPACING.xs },
});
