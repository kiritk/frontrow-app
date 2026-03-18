import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';
import { getTeamByName } from '../data/nflTeams';
import { getMLBTeamByName } from '../data/mlbTeams';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    type: string;
    sport?: string;
    venue: string;
    venue_location?: string;
    date: string;
    photos?: string[];
    home_team?: { name: string; city: string; fullName: string };
    away_team?: { name: string; city: string; fullName: string };
  };
  onDelete: () => void;
}

// Concert card color scheme
const CONCERT_COLORS = {
  gradientStart: '#1a1a2e',
  gradientMid: '#2d1f3d',
  gradientEnd: '#4a1a6b',
  accent: '#9b6dff',
  accentLight: '#c4a7ff',
};

export default function EventCard({ event, onDelete }: EventCardProps) {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - 48 - 12) / 2;
  const CARD_HEIGHT = CARD_WIDTH * 1.4;
  const PERFORATION_TOP = CARD_HEIGHT * 0.2;

  const confirmDelete = () => {
    Alert.alert('Delete Event', `Delete "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  const getCardStyle = () => {
    switch (event.type) {
      case 'concert':
        return {
          gradientColors: [CONCERT_COLORS.gradientStart, CONCERT_COLORS.gradientMid, CONCERT_COLORS.gradientEnd] as [string, string, string],
          accentColor: CONCERT_COLORS.accent,
        };
      case 'sports':
        if (event.sport === 'nfl') return { gradientColors: ['#2a1a3a', '#4a2a5a', '#6a3a7a'] as [string, string, string], accentColor: '#c9a0dc' };
        if (event.sport === 'mlb') return { gradientColors: ['#1a3a1a', '#2a5a2a', '#3a7a3a'] as [string, string, string], accentColor: '#90EE90' };
        if (event.sport === 'nba') return { gradientColors: ['#8b1538', '#a01d42', '#c0294f'] as [string, string, string], accentColor: '#ff4d6d' };
        if (event.sport === 'soccer') return { gradientColors: ['#1a5f3c', '#228b4c', '#2ecc71'] as [string, string, string], accentColor: '#5ddb8d' };
        if (event.sport === 'tennis') return { gradientColors: ['#2c3e50', '#3a4f63', '#4a6278'] as [string, string, string], accentColor: '#7fb3d3' };
        return { gradientColors: ['#1e3a5f', '#2d4a6f', '#3498db'] as [string, string, string], accentColor: '#5dade2' };
      case 'theater':
        return { gradientColors: ['#5c2a6e', '#7b3f8e', '#9b59b6'] as [string, string, string], accentColor: '#c39bd3' };
      case 'comedy':
        return { gradientColors: ['#922b21', '#b03a2e', '#cb4335'] as [string, string, string], accentColor: '#f1948a' };
      case 'landmark':
        return { gradientColors: ['#117a65', '#16a085', '#1abc9c'] as [string, string, string], accentColor: '#76d7c4' };
      default:
        return { gradientColors: ['#2c3e50', '#3a4f63', '#4a6278'] as [string, string, string], accentColor: '#85929e' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const year = date.getFullYear();
    return { month, day, year };
  };

  const { month, day, year } = formatDate(event.date);
  const cardStyle = getCardStyle();

  // Check if this is a team sport with team data
  const isNFLGame = event.sport === 'nfl' && event.home_team && event.away_team;
  const isMLBGame = event.sport === 'mlb' && event.home_team && event.away_team;
  const isTeamSport = isNFLGame || isMLBGame;

  // Get team data based on sport type
  const getHomeTeam = () => {
    if (isNFLGame) return getTeamByName(event.home_team!.name);
    if (isMLBGame) return getMLBTeamByName(event.home_team!.name);
    return null;
  };

  const getAwayTeam = () => {
    if (isNFLGame) return getTeamByName(event.away_team!.name);
    if (isMLBGame) return getMLBTeamByName(event.away_team!.name);
    return null;
  };

  const homeTeam = getHomeTeam();
  const awayTeam = getAwayTeam();

  // Get the background image source for concerts
  const getConcertBackground = () => {
    if (event.photos && event.photos.length > 0) {
      return { uri: event.photos[0] };
    }
    return require('../../assets/images/concert_bg.png');
  };

  const renderTeamSportCard = () => {
    const homeColor = homeTeam?.primaryColor || '#2a1a3a';

    return (
      <View style={[styles.card, { height: CARD_HEIGHT }]}>
        {/* Perforations */}
        <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
        <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />

        {/* Bottom solid color - home team */}
        <View style={[styles.teamBottomColor, { backgroundColor: homeColor }]} />

        {/* Stadium image - top 60% */}
        <View style={styles.teamStadiumSection}>
          <ImageBackground 
            source={homeTeam?.stadiumImage}
            style={styles.teamStadiumImage}
            imageStyle={styles.teamStadiumImageStyle}
          >
            {/* Smooth gradient fade from stadium to home team color */}
            <LinearGradient
              colors={[
                'transparent',
                'rgba(0,0,0,0)',
                homeColor + '40',
                homeColor + '80',
                homeColor + 'CC',
                homeColor,
              ]}
              locations={[0, 0.3, 0.5, 0.7, 0.85, 1]}
              style={styles.teamStadiumOverlay}
            />
          </ImageBackground>
        </View>

        {/* Content overlay */}
        <View style={styles.teamContentOverlay}>
          {/* Team logos - centered in card */}
          <View style={styles.teamLogosContainer}>
            {homeTeam && (
              <Image source={homeTeam.logo} style={styles.teamLogo} />
            )}
            <Text style={styles.teamVsText}>vs</Text>
            {awayTeam && (
              <Image source={awayTeam.logo} style={styles.teamLogo} />
            )}
          </View>

          {/* Bottom info */}
          <View style={styles.teamInfoSection}>
            <View style={styles.teamDatePill}>
              <Text style={styles.teamDateMonth}>{month} {day}</Text>
              <Text style={styles.teamDateYear}>{year}</Text>
            </View>

            <View style={styles.teamVenueSection}>
              <Ionicons name="location-outline" size={12} color="#FFFFFF" />
              <Text style={styles.teamVenueText} numberOfLines={2}>
                {event.venue}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderConcertCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      {/* Perforations */}
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />

      {/* Top section with concert background */}
      <View style={styles.topSection}>
        <ImageBackground 
          source={getConcertBackground()}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={['transparent', 'rgba(26, 26, 46, 0.7)', CONCERT_COLORS.gradientStart]}
            style={styles.imageOverlay}
          />
        </ImageBackground>
      </View>

      {/* Bottom section - title, date, venue all on same background */}
      <View style={styles.bottomSection}>
        {/* Title */}
        <Text style={styles.concertTitle} numberOfLines={2}>
          {event.title.toUpperCase()}
        </Text>

        {/* Date and Venue row */}
        <View style={styles.infoRow}>
          {/* Date pill */}
          <View style={styles.concertDatePill}>
            <Text style={styles.concertDatePillMonth}>{month} {day}</Text>
            <Text style={styles.concertDatePillYear}>{year}</Text>
          </View>

          {/* Venue */}
          <View style={styles.venueSection}>
            <Ionicons name="location-outline" size={12} color={CONCERT_COLORS.accentLight} />
            <Text style={styles.concertVenueText} numberOfLines={2}>
              {event.venue}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderDefaultCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      {/* Perforations */}
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />

      <LinearGradient
        colors={cardStyle.gradientColors}
        style={styles.defaultGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Image area */}
        <View style={styles.defaultImageArea}>
          {event.photos && event.photos.length > 0 ? (
            <ImageBackground 
              source={{ uri: event.photos[0] }} 
              style={styles.defaultImageBg}
              imageStyle={{ borderRadius: 8 }}
            >
              <LinearGradient
                colors={['transparent', cardStyle.gradientColors[0] + 'CC']}
                style={StyleSheet.absoluteFill}
              />
            </ImageBackground>
          ) : (
            <Text style={styles.defaultTitle} numberOfLines={2}>
              {event.title.toUpperCase()}
            </Text>
          )}
        </View>

        {/* Title if has photo */}
        {event.photos && event.photos.length > 0 && (
          <Text style={styles.defaultTitleWithPhoto} numberOfLines={2}>
            {event.title.toUpperCase()}
          </Text>
        )}

        {/* Bottom info */}
        <View style={styles.defaultInfoSection}>
          <View style={[styles.defaultDateBadge, { backgroundColor: cardStyle.accentColor + '20', borderColor: cardStyle.accentColor }]}>
            <Text style={[styles.defaultDateText, { color: cardStyle.accentColor }]}>{month} {day}</Text>
            <Text style={[styles.defaultYearText, { color: cardStyle.accentColor + 'CC' }]}>{year}</Text>
          </View>

          <View style={styles.defaultVenueContainer}>
            <Ionicons name="location-outline" size={10} color="#fff" />
            <Text style={styles.defaultVenueText} numberOfLines={2}>{event.venue}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderCard = () => {
    if (event.type === 'concert') {
      return renderConcertCard();
    } else if (isTeamSport && homeTeam && awayTeam) {
      return renderTeamSportCard();
    } else {
      return renderDefaultCard();
    }
  };

  return (
    <TouchableOpacity 
      onLongPress={confirmDelete} 
      activeOpacity={0.9} 
      style={[styles.cardWrapper, { width: CARD_WIDTH }]}
    >
      {renderCard()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1a1a2e',
  },
  perforationLeft: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    zIndex: 10,
  },
  perforationRight: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    zIndex: 10,
  },

  // Team sport card styles (NFL, MLB)
  teamBottomColor: {
    ...StyleSheet.absoluteFillObject,
  },
  teamStadiumSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  teamStadiumImage: {
    flex: 1,
  },
  teamStadiumImageStyle: {
    resizeMode: 'cover',
  },
  teamStadiumOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  teamContentOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 12,
    justifyContent: 'space-between',
  },
  teamLogosContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 55,
    height: 55,
    resizeMode: 'contain',
  },
  teamVsText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
    marginHorizontal: 4,
  },
  teamInfoSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  teamDatePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  teamDateMonth: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#1a1a2e',
  },
  teamDateYear: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: '#666666',
  },
  teamVenueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 8,
    gap: 3,
  },
  teamVenueText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'right',
    flexShrink: 1,
  },

  // Concert card styles
  topSection: {
    height: '50%',
    overflow: 'hidden',
  },
  imageBackground: {
    flex: 1,
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: CONCERT_COLORS.gradientStart,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  concertTitle: {
    fontFamily: FONTS.audiowide,
    fontSize: 17.5,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  concertDatePill: {
    borderWidth: 1,
    borderColor: CONCERT_COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  concertDatePillMonth: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: CONCERT_COLORS.accentLight,
  },
  concertDatePillYear: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: CONCERT_COLORS.accent,
  },
  concertVenueText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    textAlign: 'right',
    flexShrink: 1,
    color: CONCERT_COLORS.accentLight,
  },

  // Shared styles
  venueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 8,
    gap: 3,
  },

  // Default card styles
  defaultGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  defaultImageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultImageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  defaultTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  defaultTitleWithPhoto: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  defaultInfoSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  defaultDateBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  defaultDateText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  defaultYearText: {
    fontFamily: FONTS.regular,
    fontSize: 10,
  },
  defaultVenueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 8,
    gap: 3,
  },
  defaultVenueText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'right',
    flexShrink: 1,
  },
});
