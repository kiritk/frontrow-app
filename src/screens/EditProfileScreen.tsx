import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Image, Modal, Platform, Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

const UPDATE_BTN_COLOR = '#3B35B4';

interface EditProfileData {
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

interface EditProfileScreenProps {
  visible: boolean;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  onClose: () => void;
  onSave: (data: EditProfileData) => void;
}

export default function EditProfileScreen({
  visible,
  firstName: initialFirstName,
  lastName: initialLastName,
  profileImage: initialProfileImage,
  onClose,
  onSave,
}: EditProfileScreenProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [profileImage, setProfileImage] = useState<string | null>(initialProfileImage);

  useEffect(() => {
    if (visible) {
      setFirstName(initialFirstName);
      setLastName(initialLastName);
      setProfileImage(initialProfileImage);
    }
  }, [visible]);

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
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    onSave({ firstName, lastName, profileImage });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="chevron-back" size={22} color={COLORS.grayDark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit profile</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar */}
            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
              <View style={styles.editIconOverlay}>
                <Ionicons name="pencil" size={13} color={COLORS.grayDark} />
              </View>
            </TouchableOpacity>

            {/* Form Fields */}
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="What's your first name?"
                placeholderTextColor={COLORS.grayLight}
              />

              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="And your last name?"
                placeholderTextColor={COLORS.grayLight}
              />

              <TouchableOpacity style={styles.updateButton} onPress={handleSave}>
                <Text style={styles.updateButtonText}>Update Profile</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerSafe: {
    backgroundColor: COLORS.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.grayDark,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 48,
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#C8C8C8',
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  form: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 15,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.grayDark,
  },
  updateButton: {
    backgroundColor: UPDATE_BTN_COLOR,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  updateButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
});
