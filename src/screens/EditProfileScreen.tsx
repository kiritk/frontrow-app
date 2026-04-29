import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Image, Modal, Platform, Alert,
  KeyboardAvoidingView, TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

const ACCENT_COLOR = '#5B4FCF';
const UPDATE_BTN_COLOR = '#3B35B4';

interface EditProfileData {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string | null;
  profileImage: string | null;
}

interface EditProfileScreenProps {
  visible: boolean;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string | null;
  profileImage: string | null;
  onClose: () => void;
  onSave: (data: EditProfileData) => void;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function EditProfileScreen({
  visible,
  firstName: initialFirstName,
  lastName: initialLastName,
  gender: initialGender,
  dateOfBirth: initialDOB,
  profileImage: initialProfileImage,
  onClose,
  onSave,
}: EditProfileScreenProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [gender, setGender] = useState(initialGender);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    initialDOB ? new Date(initialDOB) : null,
  );
  const [profileImage, setProfileImage] = useState<string | null>(initialProfileImage);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setFirstName(initialFirstName);
      setLastName(initialLastName);
      setGender(initialGender);
      setDateOfBirth(initialDOB ? new Date(initialDOB) : null);
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

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSave = () => {
    onSave({
      firstName,
      lastName,
      gender,
      dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
      profileImage,
    });
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

              <TouchableOpacity
                style={styles.pickerInput}
                onPress={() => setShowGenderPicker(true)}
              >
                <Text style={[styles.pickerText, !gender && styles.placeholderText]}>
                  {gender || 'Select your gender'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.grayLight} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.pickerText, !dateOfBirth && styles.placeholderText]}>
                  {formatDate(dateOfBirth) || 'What is your date of birth?'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={ACCENT_COLOR} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.updateButton} onPress={handleSave}>
                <Text style={styles.updateButtonText}>Update Profile</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Gender Picker Sheet */}
        <Modal
          visible={showGenderPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGenderPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowGenderPicker(false)}>
            <View style={styles.sheetOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.genderSheet}>
                  <Text style={styles.genderSheetTitle}>Select your gender</Text>
                  {GENDER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.genderOption}
                      onPress={() => {
                        setGender(option);
                        setShowGenderPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          gender === option && styles.genderOptionSelected,
                        ]}
                      >
                        {option}
                      </Text>
                      {gender === option && (
                        <Ionicons name="checkmark" size={18} color={ACCENT_COLOR} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Date Picker Sheet */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.sheetOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.dateSheet}>
                  <View style={styles.dateSheetHeader}>
                    <Text style={styles.genderSheetTitle}>Date of Birth</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.doneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={dateOfBirth || new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(_, date) => {
                      if (Platform.OS === 'android') setShowDatePicker(false);
                      if (date) setDateOfBirth(date);
                    }}
                    style={styles.datePicker}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
  pickerInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.grayDark,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.grayLight,
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
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  genderSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  genderSheetTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.grayDark,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  genderOptionText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.grayDark,
  },
  genderOptionSelected: {
    fontFamily: FONTS.semiBold,
    color: ACCENT_COLOR,
  },
  dateSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: SPACING.lg,
    paddingBottom: 40,
  },
  dateSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  doneText: {
    position: 'absolute',
    right: SPACING.xl,
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
    color: ACCENT_COLOR,
  },
  datePicker: {
    width: '100%',
  },
});
