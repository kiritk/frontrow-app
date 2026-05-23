import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BG_FADE = '#FBFCFC';

export const EVENT_TYPE_OPTIONS = [
  { value: 'concert', label: 'Concert' },
  { value: 'sports', label: 'Sports' },
  { value: 'theater', label: 'Theater' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'landmark', label: 'Landmarks' },
  { value: 'other', label: 'Other' },
] as const;

export type EventTypeValue = (typeof EVENT_TYPE_OPTIONS)[number]['value'];

interface EventTypeStepProps {
  value: EventTypeValue | null;
  onChange: (value: EventTypeValue) => void;
  onContinue: () => void;
  onBack?: () => void;
}

export default function EventTypeStep({
  value,
  onChange,
  onContinue,
  onBack,
}: EventTypeStepProps) {
  const insets = useSafeAreaInsets();
  const canContinue = value !== null;

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../../../assets/images/splash_screen_bg.jpg')}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(251,252,252,0)', 'rgba(251,252,252,0)', BG_FADE]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            {onBack ? (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={16} color={COLORS.black} />
                <Text style={styles.backText}>BACK</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}
          </View>

          <Text style={styles.title}>What's the type of experience?</Text>
          <Text style={styles.subtitle}>
            Select the type of live experience you went too. You'll be able to add more later.
          </Text>

          <View style={styles.optionsList}>
            {EVENT_TYPE_OPTIONS.map((option) => {
              const selected = value === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => onChange(option.value)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={onContinue}
            disabled={!canContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const ACCENT = '#D63B5A';
const ACCENT_BG = 'rgba(214,59,90,0.06)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_FADE,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 250,
    paddingBottom: 24,
  },
  headerRow: {
    marginBottom: 18,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    height: 20,
  },
  backText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.black,
    marginLeft: 6,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 30,
    color: COLORS.black,
    fontStyle: 'italic',
    lineHeight: 36,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 21,
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingVertical: 18,
    paddingHorizontal: 22,
  },
  optionSelected: {
    borderColor: ACCENT,
    backgroundColor: ACCENT_BG,
  },
  optionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.black,
  },
  optionLabelSelected: {
    color: ACCENT,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D6D6D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  continueButton: {
    backgroundColor: COLORS.black,
    borderRadius: 999,
    paddingVertical: 20,
    alignItems: 'center',
    width: SCREEN_WIDTH - 32,
    alignSelf: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.35,
  },
  continueText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
