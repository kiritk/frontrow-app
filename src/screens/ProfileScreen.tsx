import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ImageBackground, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthScreen from './AuthScreen';
import EditProfileScreen from './EditProfileScreen';
import AboutScreen from './AboutScreen';
import ShareCardModal from '../components/ShareCardModal';
import { restartOnboarding } from '../lib/onboardingControl';
import { getAvatarSource } from '../lib/avatars';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

const HEADER_COLOR = '#162A45';
const ACCENT_COLOR = '#5B4FCF';
const ICON_BG_COLOR = 'rgba(91, 79, 207, 0.12)';

type ProfileView = 'main' | 'edit' | 'about' | 'auth';

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
  const { user, signOut, profile, updateProfile } = useAuth();
  const isFocused = useIsFocused();
  const [view, setView] = useState<ProfileView>('main');
  const [shareVisible, setShareVisible] = useState(false);

  // Reset to main view whenever the modal closes.
  useEffect(() => {
    if (!isFocused) setView('main');
  }, [isFocused]);

  // If the user signs in successfully while on the auth view, return to main.
  useEffect(() => {
    if (user && view === 'auth') setView('main');
  }, [user, view]);

  const handleSaveProfile = async (data: {
    firstName: string;
    lastName: string;
    profileImage: string | null;
  }) => {
    try {
      await updateProfile({ ...profile, ...data });
      setView('main');
    } catch (error) {
      console.log('Error saving profile:', error);
    }
  };

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      (navigation as any).navigate('Events');
    }
  };

  const getDisplayName = () => {
    if (profile.firstName || profile.lastName) return `${profile.firstName} ${profile.lastName}`.trim();
    return 'Welcome!';
  };

  return (
    <Modal
      visible={isFocused}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      {view === 'main' && (
        <View style={styles.modalRoot}>
          <ImageBackground
            source={require('../../assets/images/splash_screen_bg.jpg')}
            style={styles.header}
            imageStyle={styles.headerImage}
            resizeMode="cover"
          >
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
              <View style={styles.headerTopRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={styles.editSlot}>
                  <TouchableOpacity style={styles.editPill} onPress={() => setView('edit')}>
                    <Ionicons name="pencil" size={14} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.editPillText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>

            <View style={styles.avatarContainer}>
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage }} style={styles.avatarImage} />
              ) : getAvatarSource(profile.avatarId) ? (
                <Image source={getAvatarSource(profile.avatarId)!} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
            </View>
            <Text style={styles.userName}>{getDisplayName()}</Text>
            <View style={{ height: SPACING.xl }} />
          </ImageBackground>

          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
            <View style={styles.contentArea}>
              <View style={styles.menuCard}>
                <MenuItem
                  icon="heart-outline"
                  title="About Us"
                  onPress={() => setView('about')}
                />
                <View style={styles.divider} />
                <MenuItem
                  icon="share-outline"
                  title="Share Stats"
                  onPress={() => setShareVisible(true)}
                />
              </View>

              <Text style={styles.sectionLabel}>More</Text>
              <View style={styles.menuCard}>
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
                    onPress={() => setView('auth')}
                  />
                )}
                <View style={styles.divider} />
                <MenuItem
                  icon="refresh-outline"
                  title="Restart Onboarding"
                  subtitle="Walk through the welcome flow again"
                  onPress={() =>
                    Alert.alert(
                      'Restart onboarding?',
                      'You\'ll see the splash screen and onboarding flow again. Your saved events will stay put.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Restart', onPress: () => restartOnboarding() },
                      ],
                    )
                  }
                />
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {view === 'edit' && (
        <EditProfileScreen
          firstName={profile.firstName}
          lastName={profile.lastName}
          profileImage={profile.profileImage}
          onBack={() => setView('main')}
          onSave={handleSaveProfile}
        />
      )}

      {view === 'about' && <AboutScreen onBack={() => setView('main')} />}

      {view === 'auth' && (
        <View style={styles.authSheet}>
          <AuthScreen />
          <SafeAreaView edges={['top']} style={styles.authCloseContainer} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.authCloseButton}
              onPress={() => setView('main')}
            >
              <Ionicons name="close" size={20} color={COLORS.navy} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      )}

      {shareVisible && (
        <ShareCardModal visible onClose={() => setShareVisible(false)} />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: HEADER_COLOR,
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
  headerImage: {
    opacity: 0.2,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerSafeArea: {
    alignSelf: 'stretch',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  cancelButton: {
    minWidth: 80,
  },
  cancelText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    textAlign: 'center',
  },
  editSlot: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.full,
  },
  editPillText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.85)',
  },
  headerTitle: {
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
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
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
