import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BG_FADE = '#FBFCFC';

type IonIcon = keyof typeof Ionicons.glyphMap;

export const EVENT_TYPE_OPTIONS = [
  { value: 'concert', label: 'Concert', icon: 'musical-notes-outline' as IonIcon },
  { value: 'sports', label: 'Sports', icon: 'trophy-outline' as IonIcon },
  { value: 'theater', label: 'Theater', icon: 'drama-masks' as const },
  { value: 'comedy', label: 'Comedy', icon: 'mic-outline' as IonIcon },
  { value: 'landmark', label: 'Landmarks', icon: 'location-outline' as IonIcon },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' as IonIcon },
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
          locations={[0, 0.25, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.scrollContent}>
          <View style={styles.headerRow}>
            {onBack ? (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={16} color={COLORS.gray} />
                <Text style={styles.backText}>BACK</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}
          </View>

          <Text style={styles.title}>Let's add your first event</Text>
          <Text style={styles.subtitle}>
            Select the type of a live event you recently went to. This is just your first one, you'll  be able to add more later.
          </Text>

          <View style={styles.optionsList}>
            {EVENT_TYPE_OPTIONS.map((option) => {
              const selected = value === option.value;
              const iconColor = selected ? ACCENT : COLORS.black;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => onChange(option.value)}
                  activeOpacity={0.85}
                >
                  {option.icon === 'drama-masks' ? (
                    <MaterialCommunityIcons
                      name="drama-masks"
                      size={20}
                      color={iconColor}
                      style={styles.optionIcon}
                    />
                  ) : (
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={iconColor}
                      style={styles.optionIcon}
                    />
                  )}
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
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom - 10, 6) }]}>
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

const ACCENT = COLORS.navy;
const ACCENT_BG = 'rgba(30,58,95,0.06)';

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
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 165,
    paddingBottom: 12,
  },
  headerRow: {
    marginTop: 10,
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
    color: COLORS.gray,
    marginLeft: 6,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: FONTS.instrumentSerifItalic,
    fontSize: 34,
    color: COLORS.black,
    lineHeight: 40,
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
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  optionSelected: {
    borderColor: ACCENT,
    backgroundColor: ACCENT_BG,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
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
    backgroundColor: COLORS.navy,
    borderRadius: 999,
    paddingVertical: 15,
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
