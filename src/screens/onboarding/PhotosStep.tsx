import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ImageSourcePropType,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS } from '../../theme/colors';
import { getOnboardingBgImage, type EventTypeKey, type SportTypeKey } from './typeBackgrounds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BG_FADE = '#FBFCFC';
const ACCENT = '#D63B5A';
const MAX_PHOTOS = 6;

interface PhotosStepProps {
  photos: string[];
  eventType: EventTypeKey;
  sportType?: SportTypeKey | null;
  homeStadiumImage?: ImageSourcePropType | null;
  onChange: (photos: string[]) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function PhotosStep({
  photos,
  eventType,
  sportType,
  homeStadiumImage,
  onChange,
  onContinue,
  onSkip,
  onBack,
}: PhotosStepProps) {
  const insets = useSafeAreaInsets();
  const canContinue = photos.length > 0;
  const canAddMore = photos.length < MAX_PHOTOS;

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }
    const remaining = MAX_PHOTOS - photos.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled) {
      const next = [...photos, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS);
      onChange(next);
    }
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={getOnboardingBgImage(eventType, sportType, homeStadiumImage)}
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={16} color={COLORS.gray} />
              <Text style={styles.backText}>BACK</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Add a few photos?</Text>
          <Text style={styles.subtitle}>
            Add some pictures to this experience. You can always add more later.
          </Text>

          <TouchableOpacity
            style={styles.uploadZone}
            onPress={pickPhotos}
            activeOpacity={0.85}
            disabled={!canAddMore}
          >
            {photos.length === 0 ? (
              <View style={styles.uploadEmpty}>
                <Ionicons name="add" size={36} color={ACCENT} />
                <Text style={styles.uploadCaption}>TAP TO UPLOAD</Text>
                <Text style={styles.uploadHint}>Up to {MAX_PHOTOS} photos</Text>
              </View>
            ) : (
              <View style={styles.photoGrid}>
                {photos.map((uri, i) => (
                  <View key={`${uri}-${i}`} style={styles.photoThumb}>
                    <Image source={{ uri }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.photoRemove}
                      onPress={() => removePhoto(i)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="close" size={14} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                ))}
                {canAddMore && (
                  <TouchableOpacity
                    style={[styles.photoThumb, styles.photoAddMore]}
                    onPress={pickPhotos}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={28} color={ACCENT} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom - 10, 6) }]}>
          <TouchableOpacity
            onPress={onSkip}
            style={styles.skipButton}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 160,
    paddingBottom: 24,
  },
  headerRow: {
    marginTop: 10,
    marginBottom: 18,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  uploadZone: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
    minHeight: 300,
    paddingVertical: 24,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
  },
  uploadEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCaption: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.black,
    letterSpacing: 2,
    marginTop: 14,
  },
  uploadHint: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 6,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  photoThumb: {
    width: (SCREEN_WIDTH - 24 * 2 - 18 * 2 - 10 * 2) / 3,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddMore: {
    backgroundColor: 'rgba(214,59,90,0.06)',
    borderWidth: 1.5,
    borderColor: '#E5C2CB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 14,
  },
  skipText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.black,
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
