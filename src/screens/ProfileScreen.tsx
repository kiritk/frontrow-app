import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, 
  ImageBackground, Image, Modal, TextInput, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, profile_image')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setProfileImage(data.profile_image || null);
      }
    } catch (error) {
      console.log('Profile not found, using defaults');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
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
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: editFirstName,
          last_name: editLastName,
          profile_image: editProfileImage,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      setFirstName(editFirstName);
      setLastName(editLastName);
      setProfileImage(editProfileImage);
      setEditModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    }
  };

  const getDisplayName = () => {
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return '<First Name> <Last Name>';
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

                {/* Email */}
                <Text style={styles.userEmail}>{user?.email || '<email>'}</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Rest of profile content - blank for now */}
        <View style={styles.contentArea}>
          {/* Future content goes here */}
        </View>

        {/* Sign Out Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
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
          </View>
        </TouchableWithoutFeedback>
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
    fontFamily: FONTS.bold,
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
    paddingTop: SPACING.lg,
  },
  bottomSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.lg,
  },
  signOutButton: {
    backgroundColor: COLORS.navy,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
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
