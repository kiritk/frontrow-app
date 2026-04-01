import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ImageBackground, Image, Modal, TextInput, Keyboard, TouchableWithoutFeedback,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getLocalEvents } from '../lib/localStorage';
import { supabase } from '../lib/supabase';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

const PROFILE_STORAGE_KEY = 'frontrow_user_profile';

interface UserProfile {
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    loadProfile();
    fetchEventCount();
  }, [user]);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const profile: UserProfile = JSON.parse(stored);
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setProfileImage(profile.profileImage || null);
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  };

  const fetchEventCount = async () => {
    try {
      if (user) {
        // Fetch from Supabase for logged in users
        const { count } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setEventCount(count || 0);
      } else {
        // Fetch from local storage for guests
        const localEvents = await getLocalEvents();
        setEventCount(localEvents.length);
      }
    } catch (error) {
      console.log('Error fetching event count:', error);
    }
  };

  const saveProfileToStorage = async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.log('Error saving profile:', error);
    }
  };

    const openEditModal = () => {
    setEditFirstName(firstName);
    setEditLastName(lastName);
    setEditProfileImage(profileImage);
    setEditModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setEditProfileImage(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    const newProfile: UserProfile = {
      firstName: editFirstName,
      lastName: editLastName,
      profileImage: editProfileImage,
    };
    
    await saveProfileToStorage(newProfile);
    
    setFirstName(editFirstName);
    setLastName(editLastName);
    setProfileImage(editProfileImage);
    setEditModalVisible(false);
  };

  const getFanLevel = () => {
    if (eventCount >= 50) {
      return { level: 'Legend', color: '#F59E0B', nextLevel: null, eventsToNext: 0, progress: 1 };
    } else if (eventCount >= 25) {
      return { level: 'All-Star', color: '#22C55E', nextLevel: 'Legend', eventsToNext: 50 - eventCount, progress: (eventCount - 25) / 25 };
    } else if (eventCount >= 10) {
      return { level: 'Pro', color: '#DC2626', nextLevel: 'All-Star', eventsToNext: 25 - eventCount, progress: (eventCount - 10) / 15 };
    } else {
      return { level: 'Rookie', color: '#3B82F6', nextLevel: 'Pro', eventsToNext: 10 - eventCount, progress: eventCount / 10 };
    }
  };

  const fanLevel = getFanLevel();

  const getDisplayName = () => {
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return 'Welcome!';
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Header with Background Image */}
        <View style={styles.headerContainer}>
          <ImageBackground
            source={require('../../assets/images/profile_bg.jpg')}
            style={styles.headerBackground}
            imageStyle={styles.headerBackgroundImage}
          >
            <LinearGradient
              colors={['transparent', 'rgba(245, 240, 230, 0.3)', 'rgba(245, 240, 230, 0.8)', COLORS.cream]}
              locations={[0, 0.5, 0.75, 1]}
              style={styles.headerGradient}
            >
              {/* Edit Button */}
              <SafeAreaView edges={['top']} style={styles.editButtonContainer}>
                <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
                  <Ionicons name="pencil" size={16} color={COLORS.white} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </SafeAreaView>

              {/* Profile Info */}
              <View style={styles.profileInfo}>
                {/* Profile Picture */}
                <View style={styles.avatarContainer}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={50} color={COLORS.navy} />
                    </View>
                  )}
                </View>

                {/* Name */}
                <Text style={styles.userName}>{getDisplayName()}</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Fan Level Card */}
        <View style={styles.contentArea}>
          <View style={styles.fanLevelCard}>
            <View style={styles.fanLevelHeader}>
              <View>
                <Text style={styles.fanLevelTitle}>Fan Level</Text>
                <Text style={styles.fanLevelSubtitle}>
                  {fanLevel.nextLevel 
                    ? `${fanLevel.eventsToNext} more events to ${fanLevel.nextLevel}`
                    : 'You reached the highest level!'}
                </Text>
              </View>
              <View style={[styles.fanLevelBadge, { backgroundColor: fanLevel.color }]}>
                <Text style={styles.fanLevelBadgeText}>{fanLevel.level}</Text>
              </View>
            </View>

            {/* Progress Track */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min((eventCount / 50) * 100, 100)}%` }]} />
              </View>
              
              {/* Level Markers */}
              <View style={styles.levelMarkers}>
                <View style={styles.levelMarker}>
                  <View style={[styles.markerDot, { backgroundColor: '#3B82F6' }, eventCount >= 0 && styles.markerDotActive]} />
                  <Text style={styles.markerLabel}>Rookie</Text>
                  <Text style={styles.markerRange}>0-9</Text>
                </View>
                <View style={styles.levelMarker}>
                  <View style={[styles.markerDot, { backgroundColor: '#DC2626' }, eventCount >= 10 && styles.markerDotActive]} />
                  <Text style={styles.markerLabel}>Pro</Text>
                  <Text style={styles.markerRange}>10-24</Text>
                </View>
                <View style={styles.levelMarker}>
                  <View style={[styles.markerDot, { backgroundColor: '#22C55E' }, eventCount >= 25 && styles.markerDotActive]} />
                  <Text style={styles.markerLabel}>All-Star</Text>
                  <Text style={styles.markerRange}>25-49</Text>
                </View>
                <View style={styles.levelMarker}>
                  <View style={[styles.markerDot, { backgroundColor: '#F59E0B' }, eventCount >= 50 && styles.markerDotActive]} />
                  <Text style={styles.markerLabel}>Legend</Text>
                  <Text style={styles.markerRange}>50+</Text>
                </View>
              </View>
            </View>

            {/* Event Count */}
            <View style={styles.eventCountContainer}>
              <Text style={styles.eventCountNumber}>{eventCount}</Text>
              <Text style={styles.eventCountLabel}>Events Attended</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.navy} />
                </TouchableOpacity>
              </View>

              {/* Profile Picture Editor */}
              <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
                {editProfileImage ? (
                  <Image source={{ uri: editProfileImage }} style={styles.editAvatarImage} />
                ) : (
                  <View style={styles.editAvatarPlaceholder}>
                    <Ionicons name="camera" size={32} color={COLORS.gray} />
                    <Text style={styles.imagePickerText}>Add Photo</Text>
                  </View>
                )}
                <View style={styles.cameraIconOverlay}>
                  <Ionicons name="camera" size={16} color={COLORS.white} />
                </View>
              </TouchableOpacity>

              {/* Name Fields */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor={COLORS.grayLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Enter last name"
                  placeholderTextColor={COLORS.grayLight}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    height: 320,
  },
  headerBackground: {
    flex: 1,
  },
  headerBackgroundImage: {
    resizeMode: 'cover',
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  editButtonContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
  },
  editButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  profileInfo: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userName: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: 24,
    color: COLORS.navy,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  userEmail: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  fanLevelCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fanLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  fanLevelTitle: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: FONT_SIZES.xl,
    color: COLORS.navy,
    marginBottom: 4,
  },
  fanLevelSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  fanLevelBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  fanLevelBadgeText: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  progressContainer: {
    marginBottom: SPACING.lg,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.creamDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.navy,
    borderRadius: 4,
  },
  levelMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelMarker: {
    alignItems: 'center',
    flex: 1,
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
    opacity: 0.3,
  },
  markerDotActive: {
    opacity: 1,
  },
  markerLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.navy,
    marginBottom: 2,
  },
  markerRange: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.gray,
  },
  eventCountContainer: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.creamDark,
  },
  eventCountNumber: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: COLORS.navy,
  },
  eventCountLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.navy,
  },
  imagePickerContainer: {
    alignSelf: 'center',
    marginBottom: SPACING.xl,
    position: 'relative',
  },
  editAvatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.navy,
  },
  editAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.grayLight,
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.cream,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
    marginBottom: SPACING.sm,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  saveButton: {
    backgroundColor: COLORS.navy,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
});
