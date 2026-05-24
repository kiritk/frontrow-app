import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../theme/colors';
import EventCard from '../../components/EventCard';
import { LocalEvent } from '../../lib/localStorage';
import { EventTypeValue } from './EventTypeStep';
import { DetailsData } from './DetailsStep';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BG_FADE = '#FBFCFC';
const ACCENT = COLORS.navy;

const formatDateForDB = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function buildPreviewEvent(
  eventType: EventTypeValue,
  details: DetailsData,
  photos: string[],
): LocalEvent {
  const isTeamSport =
    eventType === 'sports' && (details.sportType === 'nfl' || details.sportType === 'mlb');
  const title =
    isTeamSport && details.homeTeam && details.awayTeam
      ? `${details.homeTeam.name} vs ${details.awayTeam.name}`
      : details.eventName;
  const date = details.eventDate ?? new Date();

  return {
    id: 'onboarding-preview',
    title,
    type: eventType,
    sport: eventType === 'sports' ? details.sportType ?? undefined : undefined,
    venue: details.venue || details.selectedCity?.displayName || '',
    venue_location: details.selectedCity?.displayName,
    date: formatDateForDB(date),
    photos: photos.length > 0 ? photos : undefined,
    latitude: details.selectedCity?.latitude,
    longitude: details.selectedCity?.longitude,
    home_team: details.homeTeam
      ? {
          name: details.homeTeam.name,
          city: details.homeTeam.city,
          fullName: details.homeTeam.fullName,
        }
      : undefined,
    away_team: details.awayTeam
      ? {
          name: details.awayTeam.name,
          city: details.awayTeam.city,
          fullName: details.awayTeam.fullName,
        }
      : undefined,
    created_at: new Date().toISOString(),
  };
}

interface ConfirmationStepProps {
  eventType: EventTypeValue;
  details: DetailsData;
  photos: string[];
  onAddExperience: () => void;
  onBack: () => void;
}

export default function ConfirmationStep({
  eventType,
  details,
  photos,
  onAddExperience,
  onBack,
}: ConfirmationStepProps) {
  const insets = useSafeAreaInsets();
  const previewEvent = useMemo(
    () => buildPreviewEvent(eventType, details, photos),
    [eventType, details, photos],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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

        <View style={styles.cardArea}>
          <View style={styles.tiltedCard}>
            <EventCard event={previewEvent} isFront detailCard hideViewTicket />
          </View>
        </View>

        <View style={styles.bottomBlock}>
          <Text style={styles.title}>Ready to go?</Text>
          <Text style={styles.subtitle}>
            Your first event is set up. Let's start adding some more.
          </Text>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom - 10, 6) }]}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={onAddExperience}
            activeOpacity={0.9}
          >
            <Ionicons name="add-circle" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.ctaText}>Add Experience</Text>
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
  safeArea: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 24,
    paddingTop: 18,
    marginBottom: 8,
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
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  tiltedCard: {
    transform: [{ rotate: '-4deg' }],
  },
  bottomBlock: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontFamily: FONTS.instrumentSerifItalic,
    fontSize: 34,
    color: COLORS.black,
    lineHeight: 40,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 21,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  ctaButton: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: SCREEN_WIDTH - 32,
    alignSelf: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
