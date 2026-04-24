import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ImageBackground, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS } from '../theme/colors';
import { getTeamByName } from '../data/nflTeams';
import { getMLBTeamByName } from '../data/mlbTeams';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const STACKED_CARD_HEIGHT = 230;
export const PEEK_HEIGHT = 52;

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
    case 'concert': return { gradientColors: [CONCERT_COLORS.gradientStart, CONCERT_COLORS.gradientMid, CONCERT_COLORS.gradientEnd] as [string, string, string], accentColor: CONCERT_COLORS.accent };
    case 'theater': return { gradientColors: [THEATER_COLORS.gradientStart, THEATER_COLORS.gradientMid, THEATER_COLORS.gradientEnd] as [string, string, string], accentColor: THEATER_COLORS.accent };
    case 'comedy': return { gradientColors: [COMEDY_COLORS.gradientStart, COMEDY_COLORS.gradientMid, COMEDY_COLORS.gradientEnd] as [string, string, string], accentColor: COMEDY_COLORS.accent };
    case 'landmark': return { gradientColors: [LANDMARK_COLORS.gradientStart, LANDMARK_COLORS.gradientMid, LANDMARK_COLORS.gradientEnd] as [string, string, string], accentColor: LANDMARK_COLORS.accent };
    case 'other': return { gradientColors: [OTHER_COLORS.gradientStart, OTHER_COLORS.gradientMid, OTHER_COLORS.gradientEnd] as [string, string, string], accentColor: OTHER_COLORS.accent };
    case 'sports':
      if (sport === 'nfl') return { gradientColors: ['#2a1a3a', '#4a2a5a', '#6a3a7a'] as [string, string, string], accentColor: '#BA4813' };
      if (sport === 'mlb') return { gradientColors: ['#1a3a1a', '#2a5a2a', '#3a7a3a'] as [string, string, string], accentColor: '#D90000' };
      if (sport === 'nba') return { gradientColors: ['#7a3000', '#c04e1a', '#f0622d'] as [string, string, string], accentColor: '#FF6B24' };
      if (sport === 'soccer') return { gradientColors: ['#003d5c', '#005a8a', '#0077B6'] as [string, string, string], accentColor: '#66b8de' };
      if (sport === 'tennis') return { gradientColors: ['#3d5c00', '#4e7a00', '#6b9a00'] as [string, string, string], accentColor: '#a0c300' };
      return { gradientColors: ['#5c0008', '#900010', '#c30010'] as [string, string, string], accentColor: '#003FFF' };
    default: return { gradientColors: ['#2c3e50', '#3a4f63', '#4a6278'] as [string, string, string], accentColor: '#85929e' };
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

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const year = d.getFullYear();
  return { month, day, year };
};

export default function EventCard({ event, onPress }: EventCardProps) {
  const { month, day, year } = formatDate(event.date);
  const cardStyle = getCardStyle(event.type, event.sport);

  const isNFLGame = event.sport === 'nfl' && event.home_team && event.away_team;
  const isMLBGame = event.sport === 'mlb' && event.home_team && event.away_team;
  const isTeamSport = isNFLGame || isMLBGame;

  const homeTeam = isNFLGame ? getTeamByName(event.home_team!.name) : isMLBGame ? getMLBTeamByName(event.home_team!.name) : null;
  const awayTeam = isNFLGame ? getTeamByName(event.away_team!.name) : isMLBGame ? getMLBTeamByName(event.away_team!.name) : null;

  const bgSource = getBackgroundSource(event, homeTeam);
  const titleFont = getTitleFont(event.type);
  const displayTitle = getTitleText(event.title, event.type);

  return (
    <View style={styles.stackedCardWrapper}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.95} style={{ flex: 1 }}>
        <View style={styles.stackedCard}>
          {bgSource ? (
            <ImageBackground
              source={bgSource}
              style={StyleSheet.absoluteFill}
              imageStyle={styles.stackedBgImage}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.62)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.68)']}
                locations={[0, 0.42, 1]}
                style={StyleSheet.absoluteFill}
              />
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={cardStyle.gradientColors}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          )}

          {(() => {
            const bandColor = (isTeamSport && homeTeam) ? homeTeam.primaryColor : cardStyle.accentColor;
            return (
              <LinearGradient
                colors={[bandColor + 'FF', bandColor + 'B3', bandColor + '00']}
                locations={[0, 0.667, 1]}
                style={styles.accentBand}
              />
            );
          })()}

          <View style={styles.peekHeader}>
            {isTeamSport && homeTeam && awayTeam ? (
              <View style={styles.peekTeamRow}>
                <Image source={homeTeam.logo} style={styles.peekTeamLogo} />
                <Text style={styles.peekVs}>vs</Text>
                <Image source={awayTeam.logo} style={styles.peekTeamLogo} />
              </View>
            ) : (
              <Text style={[styles.peekTitle, { fontFamily: titleFont }]} numberOfLines={1}>
                {displayTitle}
              </Text>
            )}
            <Text style={styles.peekDate}>{month} {day}, {year}</Text>
          </View>

          <View style={styles.stackedBody}>
            {isTeamSport && homeTeam && awayTeam ? (
              <View style={styles.stackedTeamRow}>
                <Image source={homeTeam.logo} style={styles.stackedLogo} />
                <Text style={styles.stackedVs}>VS</Text>
                <Image source={awayTeam.logo} style={styles.stackedLogo} />
              </View>
            ) : (
              <Text style={[styles.stackedTitle, { fontFamily: titleFont }]} numberOfLines={2}>
                {displayTitle}
              </Text>
            )}
          </View>

          <View style={styles.stackedFooter}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.75)" />
            <Text style={styles.stackedVenue} numberOfLines={1}>{event.venue}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  stackedCardWrapper: {
    width: SCREEN_WIDTH * 0.9,
    height: STACKED_CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  stackedCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  stackedBgImage: {
    resizeMode: 'cover',
  },
  accentBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
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
  peekDate: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  peekTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  peekTeamLogo: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  peekVs: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  stackedTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
  },
  stackedBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackedTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stackedLogo: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  stackedVs: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  stackedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 6,
  },
  stackedVenue: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
  },
});
