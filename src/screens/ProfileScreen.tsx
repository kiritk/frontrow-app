import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import AuthScreen from './AuthScreen';
import EditProfileScreen from './EditProfileScreen';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

const PROFILE_STORAGE_KEY = 'frontrow_user_profile';
const HEADER_COLOR = '#162A45';
const ACCENT_COLOR = '#5B4FCF';
const ICON_BG_COLOR = 'rgba(91, 79, 207, 0.12)';

interface UserProfile {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string | null;
  profileImage: string | null;
}

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  iconBgColor?: string;
  iconColor?: string;
  onPress: () => void;
}

function MenuItem({
  icon,
  title,
  subtitle,
  titleColor = COLORS.grayDark,
  iconBgColor = ICON_BG_COLOR,
  iconColor = ACCENT_COLOR,
  onPress,
}: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: titleColor }]}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.grayLight} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (user && authModalVisible) setAuthModalVisible(false);
  }, [user, authModalVisible]);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const profile: UserProfile = JSON.parse(stored);
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setGender(profile.gender || '');
        setDateOfBirth(profile.dateOfBirth || null);
        setProfileImage(profile.profileImage || null);
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  };

  const handleSaveProfile = async (data: UserProfile) => {
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setGender(data.gender);
      setDateOfBirth(data.dateOfBirth);
      setProfileImage(data.profileImage);
      setEditModalVisible(false);
    } catch (error) {
      console.log('Error saving profile:', error);
    }
  };

  const getDisplayName = () => {
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return 'First Last';
  };

  return (
    <View style={styles.container}>
      {/* Dark header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>

        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>

        <Text style={styles.userName}>{getDisplayName()}</Text>
        <View style={{ height: SPACING.xl }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.contentArea}>
          {/* Primary actions card */}
          <View style={styles.menuCard}>
            <MenuItem
              icon="pencil-outline"
              title="Edit profile"
              onPress={() => setEditModalVisible(true)}
            />
            <View style={styles.divider} />
            {user ? (
              <MenuItem
                icon="log-out-outline"
                title="Log Out"
                titleColor={COLORS.error}
                iconBgColor="rgba(239, 68, 68, 0.12)"
                iconColor={COLORS.error}
                onPress={() =>
                  Alert.alert(
                    'Log out',
                    'Are you sure you want to log out?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
                    ],
                  )
                }
              />
            ) : (
              <MenuItem
                icon="link-outline"
                title="Create an Account"
                subtitle="Save your experiences across devices"
                onPress={() => setAuthModalVisible(true)}
              />
            )}
          </View>

          {/* More section */}
          <Text style={styles.sectionLabel}>More</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="notifications-outline"
              title="Help & Support"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="heart-outline"
              title="About App"
              onPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>

      {/* Sign in / sign up sheet */}
      <Modal
        visible={authModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={styles.authSheet}>
          <AuthScreen />
          <SafeAreaView edges={['top']} style={styles.authCloseContainer} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.authCloseButton}
              onPress={() => setAuthModalVisible(false)}
            >
              <Ionicons name="close" size={20} color={COLORS.navy} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Edit Profile full-screen */}
      <EditProfileScreen
        visible={editModalVisible}
        firstName={firstName}
        lastName={lastName}
        gender={gender}
        dateOfBirth={dateOfBirth}
        profileImage={profileImage}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: HEADER_COLOR,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  headerSafeArea: {
    alignSelf: 'stretch',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    textAlign: 'center',
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#C8C8C8',
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentArea: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 100,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
  },
  menuSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 68,
  },
  sectionLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    marginTop: SPACING.md,
  },
  authSheet: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  authCloseContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    alignItems: 'flex-end',
    padding: SPACING.md,
  },
  authCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.creamDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
