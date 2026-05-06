import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ImageBackground, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';

import { COLORS, FONTS } from '../theme/colors';
import { getTeamByName } from '../data/nflTeams';
import { getMLBTeamByName } from '../data/mlbTeams';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const STACKED_CARD_HEIGHT = 280;
export const PEEK_HEIGHT = 60;

export interface EventData {
  id: string;
  title: string;
  type: string;
  sport?: string;
  venue: string;
  venue_location?: string;
  date: string;
  photos?: string[];
  cover_photo?: string;
  home_team?: { name: string; city: string; fullName: string };
  away_team?: { name: string; city: string; fullName: string };
}

interface EventCardProps {
  event: EventData;
  onPress?: () => void;
  isFront?: boolean;
  hideViewTicket?: boolean;
}

const CONCERT_COLORS = {
  gradientStart: '#1a1a2e', gradientMid: '#2d1f3d', gradientEnd: '#4a1a6b',
  accent: '#9b6dff', accentLight: '#c4a7ff',
};
const THEATER_COLORS = {
  gradientStart: '#1a0a0a', gradientMid: '#3d1a1a', gradientEnd: '#6b1a2e',
  accent: '#003CFF', accentLight: '#FFECB3',
};
const COMEDY_COLORS = {
  gradientStart: '#1a0505', gradientMid: '#3d0a0a', gradientEnd: '#6b0101',
  accent: '#FF6B6B', accentLight: '#FFB3B3',
};
const LANDMARK_COLORS = {
  gradientStart: '#1a1917', gradientMid: '#2d2b28', gradientEnd: '#3b3734',
  accent: '#D4A574', accentLight: '#E8D4C4',
};
const OTHER_COLORS = {
  gradientStart: '#2a1510', gradientMid: '#4d2a1f', gradientEnd: '#e6563b',
  accent: '#FFB899', accentLight: '#FFE0D4',
};

export const getCardStyle = (type: string, sport?: string) => {
  switch (type) {
    case 'concert':  return { gradientColors: ['#3a1570', '#4C1D90', '#5e25b0'] as [string, string, string], accentColor: '#4C1D90' };
    case 'theater':  return { gradientColors: ['#182847', '#223766', '#2a4480'] as [string, string, string], accentColor: '#223766' };
    case 'comedy':   return { gradientColors: [COMEDY_COLORS.gradientStart,  COMEDY_COLORS.gradientMid,  COMEDY_COLORS.gradientEnd]  as [string, string, string], accentColor: COMEDY_COLORS.accent };
    case 'landmark': return { gradientColors: [LANDMARK_COLORS.gradientStart, LANDMARK_COLORS.gradientMid, LANDMARK_COLORS.gradientEnd] as [string, string, string], accentColor: LANDMARK_COLORS.accent };
    case 'other':    return { gradientColors: [OTHER_COLORS.gradientStart,    OTHER_COLORS.gradientMid,    OTHER_COLORS.gradientEnd]    as [string, string, string], accentColor: OTHER_COLORS.accent };
    case 'sports':
      if (sport === 'nfl')    return { gradientColors: ['#2a1a3a', '#4a2a5a', '#6a3a7a'] as [string, string, string], accentColor: '#BA4813' };
      if (sport === 'mlb')    return { gradientColors: ['#6a1818', '#8D2222', '#b02828'] as [string, string, string], accentColor: '#8D2222' };
      if (sport === 'nba')    return { gradientColors: ['#4f2415', '#69301D', '#833d26'] as [string, string, string], accentColor: '#69301D' };
      if (sport === 'soccer') return { gradientColors: ['#184e68', '#22698D', '#2a80ae'] as [string, string, string], accentColor: '#22698D' };
      if (sport === 'tennis') return { gradientColors: ['#186830', '#228D40', '#2ab050'] as [string, string, string], accentColor: '#228D40' };
      return { gradientColors: ['#5c0008', '#900010', '#c30010'] as [string, string, string], accentColor: '#003FFF' };
    default: return { gradientColors: ['#2c3e50', '#3a4f63', '#4a6278'] as [string, string, string], accentColor: '#85929e' };
  }
};

// Solid flat background color for peeking cards (100% opaque, no gradient)
const getEventSolidColor = (type: string, sport?: string): string => {
  switch (type) {
    case 'concert':  return '#4C1D90';
    case 'theater':  return '#223766';
    case 'comedy':   return '#6b0101';
    case 'landmark': return '#3b3734';
    case 'other':    return '#e6563b';
    case 'sports':
      if (sport === 'nba')    return '#69301D';
      if (sport === 'nfl')    return '#BA4813';
      if (sport === 'mlb')    return '#8D2222';
      if (sport === 'soccer') return '#22698D';
      if (sport === 'tennis') return '#228D40';
      return '#c30010';
    default: return '#2c3e50';
  }
};

// Semi-transparent gradient overlay for the front card (lets background image show through)
const getEventOverlayColors = (type: string, sport?: string): [string, string, string] => {
  switch (type) {
    case 'concert':  return ['rgba(76,29,144,0.72)', 'rgba(76,29,144,0.35)', 'rgba(76,29,144,0.82)'];
    case 'theater':  return ['rgba(34,55,102,0.72)',  'rgba(34,55,102,0.35)',  'rgba(34,55,102,0.82)'];
    case 'comedy':   return ['rgba(61,10,10,0.72)',   'rgba(61,10,10,0.35)',   'rgba(107,1,1,0.82)'];
    case 'landmark': return ['rgba(26,25,23,0.72)',   'rgba(45,43,40,0.35)',   'rgba(59,55,52,0.82)'];
    case 'other':    return ['rgba(42,21,16,0.72)',   'rgba(77,42,31,0.35)',   'rgba(230,86,59,0.82)'];
    case 'sports':
      if (sport === 'nba')    return ['rgba(105,48,29,0.72)',  'rgba(105,48,29,0.38)',  'rgba(105,48,29,0.82)'];
      if (sport === 'nfl')    return ['rgba(80,30,8,0.72)',    'rgba(50,20,5,0.35)',    'rgba(100,40,10,0.82)'];
      if (sport === 'mlb')    return ['rgba(141,34,34,0.72)',  'rgba(141,34,34,0.35)',  'rgba(141,34,34,0.82)'];
      if (sport === 'soccer') return ['rgba(34,105,141,0.72)', 'rgba(34,105,141,0.35)', 'rgba(34,105,141,0.82)'];
      if (sport === 'tennis') return ['rgba(34,141,64,0.72)',  'rgba(34,141,64,0.35)',  'rgba(34,141,64,0.82)'];
      return ['rgba(92,0,8,0.72)', 'rgba(144,0,16,0.35)', 'rgba(195,0,16,0.82)'];
    default:
      return ['rgba(44,62,80,0.72)', 'rgba(58,79,99,0.35)', 'rgba(74,98,120,0.82)'];
  }
};

export const getBackgroundSource = (event: EventData, homeTeam: any) => {
  const photos = event.photos || [];
  if (photos.length > 0 && photos[0]) return { uri: photos[0] };
  if (event.cover_photo) return { uri: event.cover_photo };
  const isTeamSport = (event.sport === 'nfl' || event.sport === 'mlb') && event.home_team && event.away_team;
  switch (event.type) {
    case 'concert': return require('../../assets/images/concert_bg.png');
    case 'theater': return require('../../assets/images/theater_bg.jpg');
    case 'comedy': return require('../../assets/images/comedy_bg.jpg');
    case 'landmark': return require('../../assets/images/landmark_bg.jpg');
    case 'other': return require('../../assets/images/other_bg.jpg');
    case 'sports':
      if (isTeamSport && homeTeam?.stadiumImage) return homeTeam.stadiumImage;
      if (event.sport === 'nba') return require('../../assets/images/basketball_bg.jpg');
      if (event.sport === 'soccer') return require('../../assets/images/soccer_bg.jpg');
      if (event.sport === 'tennis') return require('../../assets/images/tennis_bg.jpg');
      return require('../../assets/images/other_sports_bg.jpg');
    default: return null;
  }
};

const getTitleFont = (type: string) => {
  switch (type) {
    case 'concert':  return FONTS.audiowide;
    case 'theater':  return FONTS.limelight;
    case 'comedy':   return FONTS.modak;
    case 'landmark': return FONTS.iceland;
    case 'other':    return FONTS.zain;
    default:         return FONTS.bold;
  }
};

const getTitleText = (title: string, type: string) => {
  switch (type) {
    case 'concert':
    case 'theater':
    case 'landmark':
      return title.toUpperCase();
    default:
      return title;
  }
};

const getEventLabel = (type: string, sport?: string): string => {
  if (type === 'sports') {
    switch (sport) {
      case 'nba': return 'NBA';
      case 'nfl': return 'NFL';
      case 'mlb': return 'MLB';
      case 'soccer': return 'Soccer';
      case 'tennis': return 'Tennis';
      default: return 'Sports';
    }
  }
  switch (type) {
    case 'concert':  return 'Concert';
    case 'theater':  return 'Theater';
    case 'comedy':   return 'Comedy';
    case 'landmark': return 'Landmark';
    case 'other':    return 'Other';
    default:         return '';
  }
};

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const year = d.getFullYear();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  return { month, day, year, weekday };
};

export default React.memo(function EventCard({ event, onPress, isFront = false, hideViewTicket = false }: EventCardProps) {
  const { month, day, year, weekday } = formatDate(event.date);
  const cardStyle = getCardStyle(event.type, event.sport);
  const overlayColors = getEventOverlayColors(event.type, event.sport);
  const eventLabel = getEventLabel(event.type, event.sport);

  const isNFLGame = event.sport === 'nfl' && event.home_team && event.away_team;
  const isMLBGame = event.sport === 'mlb' && event.home_team && event.away_team;
  const isTeamSport = isNFLGame || isMLBGame;

  const homeTeam = isNFLGame ? getTeamByName(event.home_team!.name) : isMLBGame ? getMLBTeamByName(event.home_team!.name) : null;
  const awayTeam = isNFLGame ? getTeamByName(event.away_team!.name) : isMLBGame ? getMLBTeamByName(event.away_team!.name) : null;

  const bgSource = getBackgroundSource(event, homeTeam);
  const titleFont = getTitleFont(event.type);
  const displayTitle = getTitleText(event.title, event.type);
  const accentColor = (isTeamSport && homeTeam) ? homeTeam.primaryColor : cardStyle.accentColor;
  const solidColor = getEventSolidColor(event.type, event.sport);

  // Press spring animation
  const pressScale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }, [pressScale]);
  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [pressScale]);

  const peekTitle = isTeamSport && event.home_team && event.away_team
    ? `${event.home_team.name} vs ${event.away_team.name}`
    : displayTitle;

  return (
    <Animated.View style={[styles.stackedCardWrapper, { backgroundColor: solidColor }, animatedStyle]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={1}
        style={{ flex: 1 }}
      >
        <View style={styles.stackedCard}>

          {/* Layer 1 + 2: Background + color overlay */}
          {bgSource ? (
            <ImageBackground
              source={bgSource}
              style={StyleSheet.absoluteFill}
              imageStyle={styles.stackedBgImage}
            >
              {isFront && <View style={[StyleSheet.absoluteFill, styles.imageDarken]} />}
              {isFront ? (
                // Front card: semi-transparent gradient so the image shows through
                <LinearGradient
                  colors={overlayColors}
                  locations={[0, 0.42, 1]}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                // Peeking card: color overlay at 90% so the card's own image subtly shows through
                <View style={[StyleSheet.absoluteFill, { backgroundColor: solidColor, opacity: 0.90 }]} />
              )}
            </ImageBackground>
          ) : (
            // No image: solid event color
            <View style={[StyleSheet.absoluteFill, { backgroundColor: solidColor }]} />
          )}

          {/* Layer 3 + 4: Glass highlight and grain — front card only */}
          {isFront && (
            <>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
                style={styles.glassHighlight}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.04)', 'rgba(0,0,0,0.04)', 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.03)']}
                locations={[0, 0.33, 0.66, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.03)', 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.03)', 'rgba(255,255,255,0.02)']}
                locations={[0, 0.33, 0.66, 1]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </>
          )}

          {/* Top shadow gradient — all cards */}
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
            style={styles.peekBottomEdge}
            pointerEvents="none"
          />

          {isFront ? (
            // ── Front card: full expanded layout ─────────────────────────
            <>
              {/* Top row: category tag (left) + stacked date (right) */}
              <View style={styles.frontTopRow}>
                {eventLabel ? (
                  <View style={styles.categoryTag}>
                    <View style={[styles.categoryDot, { backgroundColor: accentColor }]} />
                    <Text style={styles.categoryTagText}>{eventLabel}</Text>
                  </View>
                ) : <View />}
                <View style={styles.dateChip}>
                  <Text style={styles.dateChipMonth}>{month}</Text>
                  <Text style={styles.dateChipDay}>{String(day).padStart(2, '0')}</Text>
                  <Text style={styles.dateChipWeekday}>{weekday}</Text>
                </View>
              </View>

              {/* Title + category tag */}
              <View style={styles.frontTitleArea}>
                {isTeamSport && homeTeam && awayTeam ? (
                  <View style={styles.teamLogoRow}>
                    <Image source={homeTeam.logo} style={styles.teamLogo} />
                    <Text style={styles.vsText}>VS</Text>
                    <Image source={awayTeam.logo} style={styles.teamLogo} />
                  </View>
                ) : (
                  <Text style={[styles.frontTitle, { fontFamily: titleFont }]} numberOfLines={2}>
                    {displayTitle}
                  </Text>
                )}
              </View>

              {/* Footer: venue (left) + View Ticket button (right) */}
              <View style={styles.frontFooter}>
                <View style={styles.venueBlock}>
                  <View style={styles.venueRow}>
                    <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.75)" />
                    <Text style={styles.venueName} numberOfLines={1}>{event.venue}</Text>
                  </View>
                  {event.venue_location ? (
                    <Text style={styles.venueLocation} numberOfLines={1}>{event.venue_location.split(',')[0].trim()}</Text>
                  ) : null}
                </View>
                {!hideViewTicket && (
                  <TouchableOpacity style={styles.viewTicketButton} activeOpacity={0.85} onPress={onPress}>
                    <Ionicons name="ticket-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.viewTicketText}>View Ticket</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            // ── Peeking card: compact header strip ───────────────────────
            <View style={styles.peekHeader}>
              <Text
                style={[
                  event.type === 'sports' ? styles.peekSportsTitle : styles.peekTitle,
                  event.type !== 'sports' && { fontFamily: titleFont },
                ]}
                numberOfLines={1}
              >
                {peekTitle}
              </Text>
              <Text style={styles.peekDate}>{month} {day}, {year}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

    </Animated.View>
  );
});

const styles = StyleSheet.create({
  stackedCardWrapper: {
    width: SCREEN_WIDTH * 0.9,
    height: STACKED_CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  stackedCard: {
    flex: 1,
    borderRadius: 19,
    overflow: 'hidden',
  },
  stackedBgImage: {
    resizeMode: 'cover',
  },
  imageDarken: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
  },
  peekBottomEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PEEK_HEIGHT - 18,
  },

  // ── Peeking card styles ────────────────────────────────────────────────
  peekHeader: {
    height: PEEK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  peekTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  peekSportsTitle: {
    fontFamily: FONTS.tourney,
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  peekDate: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Front card styles ─────────────────────────────────────────────────
  frontTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  nextUpBadge: {
    backgroundColor: 'rgba(80,120,255,0.90)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nextUpText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dateChip: {
    alignItems: 'flex-end',
  },
  dateChipMonth: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.80)',
    letterSpacing: 1.5,
  },
  dateChipDay: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    color: '#FFFFFF',
    lineHeight: 38,
    marginTop: -2,
  },
  dateChipWeekday: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: -4,
  },
  frontTitleArea: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    gap: 8,
  },
  frontTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 33,
  },
  teamLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  teamLogo: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
  vsText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: 'rgba(255,255,255,0.90)',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    gap: 6,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  categoryTagText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  frontFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  venueBlock: {
    flex: 1,
    gap: 2,
    marginRight: 12,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  venueName: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  venueLocation: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    paddingLeft: 18,
  },
  viewTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,58,95,0.85)',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
  },
  viewTicketText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },

});
