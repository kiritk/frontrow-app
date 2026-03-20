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

// Theater card color scheme
const THEATER_COLORS = {
  gradientStart: '#1a0a0a',
  gradientMid: '#3d1a1a',
  gradientEnd: '#6b1a2e',
  accent: '#FFD700',
  accentLight: '#FFECB3',
};

// Comedy card color scheme
const COMEDY_COLORS = {
  gradientStart: '#1a0505',
  gradientMid: '#3d0a0a',
  gradientEnd: '#6b0101',
  accent: '#FF6B6B',
  accentLight: '#FFB3B3',
};

// Landmark card color scheme
const LANDMARK_COLORS = {
  gradientStart: '#1a1917',
  gradientMid: '#2d2b28',
  gradientEnd: '#3b3734',
  accent: '#D4A574',
  accentLight: '#E8D4C4',
};

// Other card color scheme
const OTHER_COLORS = {
  gradientStart: '#2a1510',
  gradientMid: '#4d2a1f',
  gradientEnd: '#e6563b',
  accent: '#FFB899',
  accentLight: '#FFE0D4',
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
      case 'theater':
        return {
          gradientColors: [THEATER_COLORS.gradientStart, THEATER_COLORS.gradientMid, THEATER_COLORS.gradientEnd] as [string, string, string],
          accentColor: THEATER_COLORS.accent,
        };
      case 'comedy':
        return {
          gradientColors: [COMEDY_COLORS.gradientStart, COMEDY_COLORS.gradientMid, COMEDY_COLORS.gradientEnd] as [string, string, string],
          accentColor: COMEDY_COLORS.accent,
        };
      case 'landmark':
        return {
          gradientColors: [LANDMARK_COLORS.gradientStart, LANDMARK_COLORS.gradientMid, LANDMARK_COLORS.gradientEnd] as [string, string, string],
          accentColor: LANDMARK_COLORS.accent,
        };
      case 'other':
        return {
          gradientColors: [OTHER_COLORS.gradientStart, OTHER_COLORS.gradientMid, OTHER_COLORS.gradientEnd] as [string, string, string],
          accentColor: OTHER_COLORS.accent,
        };
      case 'sports':
        if (event.sport === 'nfl') return { gradientColors: ['#2a1a3a', '#4a2a5a', '#6a3a7a'] as [string, string, string], accentColor: '#c9a0dc' };
        if (event.sport === 'mlb') return { gradientColors: ['#1a3a1a', '#2a5a2a', '#3a7a3a'] as [string, string, string], accentColor: '#90EE90' };
        if (event.sport === 'nba') return { gradientColors: ['#8b1538', '#a01d42', '#c0294f'] as [string, string, string], accentColor: '#ff4d6d' };
        if (event.sport === 'soccer') return { gradientColors: ['#1a5f3c', '#228b4c', '#2ecc71'] as [string, string, string], accentColor: '#5ddb8d' };
        if (event.sport === 'tennis') return { gradientColors: ['#2c3e50', '#3a4f63', '#4a6278'] as [string, string, string], accentColor: '#7fb3d3' };
        return { gradientColors: ['#1e3a5f', '#2d4a6f', '#3498db'] as [string, string, string], accentColor: '#5dade2' };
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

  // Get the background image source for theater
  const getTheaterBackground = () => {
    if (event.photos && event.photos.length > 0) {
      return { uri: event.photos[0] };
    }
    return require('../../assets/images/theater_bg.jpg');
  };

  // Get the background image source for comedy
  const getComedyBackground = () => {
    if (event.photos && event.photos.length > 0) {
      return { uri: event.photos[0] };
    }
    return require('../../assets/images/comedy_bg.jpg');
  };

  // Get the background image source for landmark
  const getLandmarkBackground = () => {
    if (event.photos && event.photos.length > 0) {
      return { uri: event.photos[0] };
    }
    return require('../../assets/images/landmark_bg.jpg');
  };

  // Get the background image source for other
  const getOtherBackground = () => {
    if (event.photos && event.photos.length > 0) {
      return { uri: event.photos[0] };
    }
    return require('../../assets/images/other_bg.jpg');
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

  const renderTheaterCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      {/* Perforations */}
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />

      {/* Top section with theater background */}
      <View style={styles.topSection}>
        <ImageBackground 
          source={getTheaterBackground()}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={['transparent', 'rgba(26, 10, 10, 0.7)', THEATER_COLORS.gradientStart]}
            style={styles.imageOverlay}
          />
        </ImageBackground>
      </View>

      {/* Bottom section - title, date, venue */}
      <View style={[styles.bottomSection, { backgroundColor: THEATER_COLORS.gradientStart }]}>
        {/* Title */}
        <Text style={styles.theaterTitle} numberOfLines={2}>
          {event.title.toUpperCase()}
        </Text>

        {/* Date and Venue row */}
        <View style={styles.infoRow}>
          {/* Date pill */}
          <View style={styles.theaterDatePill}>
            <Text style={styles.theaterDatePillMonth}>{month} {day}</Text>
            <Text style={styles.theaterDatePillYear}>{year}</Text>
          </View>

          {/* Venue */}
          <View style={styles.venueSection}>
            <Ionicons name="location-outline" size={12} color={THEATER_COLORS.accentLight} />
            <Text style={styles.theaterVenueText} numberOfLines={2}>
              {event.venue}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderComedyCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      {/* Perforations */}
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />

      {/* Top section with comedy background */}
      <View style={styles.topSection}>
        <ImageBackground 
          source={getComedyBackground()}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={['transparent', 'rgba(26, 5, 5, 0.7)', COMEDY_COLORS.gradientStart]}
            style={styles.imageOverlay}
          />
        </ImageBackground>
      </View>

      {/* Bottom section - title, date, venue */}
      <View style={[styles.bottomSection, { backgroundColor: COMEDY_COLORS.gradientStart }]}>
        {/* Title */}
        <Text style={styles.comedyTitle} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Date and Venue row */}
        <View style={styles.infoRow}>
          {/* Date pill */}
          <View style={styles.comedyDatePill}>
            <Text style={styles.comedyDatePillMonth}>{month} {day}</Text>
            <Text style={styles.comedyDatePillYear}>{year}</Text>
          </View>

          {/* Venue */}
          <View style={styles.venueSection}>
            <Ionicons name="location-outline" size={12} color={COMEDY_COLORS.accentLight} />
            <Text style={styles.comedyVenueText} numberOfLines={2}>
              {event.venue}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderLandmarkCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      {/* Perforations */}
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />

      {/* Top section with landmark background */}
      <View style={styles.topSection}>
        <ImageBackground 
          source={getLandmarkBackground()}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={['transparent', 'rgba(26, 25, 23, 0.7)', LANDMARK_COLORS.gradientStart]}
            style={styles.imageOverlay}
          />
        </ImageBackground>
      </View>

      {/* Bottom section - title, date, venue */}
      <View style={[styles.bottomSection, { backgroundColor: LANDMARK_COLORS.gradientStart }]}>
        {/* Title */}
        <Text style={styles.landmarkTitle} numberOfLines={2}>
          {event.title.toUpperCase()}
        </Text>

        {/* Date and Venue row */}
        <View style={styles.infoRow}>
          {/* Date pill */}
          <View style={styles.landmarkDatePill}>
            <Text style={styles.landmarkDatePillMonth}>{month} {day}</Text>
            <Text style={styles.landmarkDatePillYear}>{year}</Text>
          </View>

          {/* Venue */}
          <View style={styles.venueSection}>
            <Ionicons name="location-outline" size={12} color={LANDMARK_COLORS.accentLight} />
            <Text style={styles.landmarkVenueText} numberOfLines={2}>
              {event.venue}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderOtherCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      {/* Perforations */}
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />

      {/* Top section with other background */}
      <View style={styles.topSection}>
        <ImageBackground 
          source={getOtherBackground()}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={['transparent', 'rgba(42, 21, 16, 0.7)', OTHER_COLORS.gradientStart]}
            style={styles.imageOverlay}
          />
        </ImageBackground>
      </View>

      {/* Bottom section - title, date, venue */}
      <View style={[styles.bottomSection, { backgroundColor: OTHER_COLORS.gradientStart }]}>
        {/* Title */}
        <Text style={styles.otherTitle} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Date and Venue row */}
        <View style={styles.infoRow}>
          {/* Date pill */}
          <View style={styles.otherDatePill}>
            <Text style={styles.otherDatePillMonth}>{month} {day}</Text>
            <Text style={styles.otherDatePillYear}>{year}</Text>
          </View>

          {/* Venue */}
          <View style={styles.venueSection}>
            <Ionicons name="location-outline" size={12} color={OTHER_COLORS.accentLight} />
            <Text style={styles.otherVenueText} numberOfLines={2}>
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
    } else if (event.type === 'theater') {
      return renderTheaterCard();
    } else if (event.type === 'comedy') {
      return renderComedyCard();
    } else if (event.type === 'landmark') {
      return renderLandmarkCard();
    } else if (event.type === 'other') {
      return renderOtherCard();
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
    borderRadius: 8,
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

  // Theater card styles
  theaterTitle: {
    fontFamily: FONTS.limelight,
    fontSize: 18,
    color: THEATER_COLORS.accent,
    textAlign: 'center',
    letterSpacing: 1,
  },
  theaterDatePill: {
    borderWidth: 1,
    borderColor: THEATER_COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  theaterDatePillMonth: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: THEATER_COLORS.accentLight,
  },
  theaterDatePillYear: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: THEATER_COLORS.accent,
  },
  theaterVenueText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    textAlign: 'right',
    flexShrink: 1,
    color: THEATER_COLORS.accentLight,
  },

  // Comedy card styles
  comedyTitle: {
    fontFamily: FONTS.modak,
    fontSize: 22,
    color: COMEDY_COLORS.accent,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  comedyDatePill: {
    borderWidth: 1,
    borderColor: COMEDY_COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  comedyDatePillMonth: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: COMEDY_COLORS.accentLight,
  },
  comedyDatePillYear: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COMEDY_COLORS.accent,
  },
  comedyVenueText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    textAlign: 'right',
    flexShrink: 1,
    color: COMEDY_COLORS.accentLight,
  },

  // Landmark card styles
  landmarkTitle: {
    fontFamily: FONTS.iceland,
    fontSize: 20,
    color: LANDMARK_COLORS.accent,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  landmarkDatePill: {
    borderWidth: 1,
    borderColor: LANDMARK_COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  landmarkDatePillMonth: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: LANDMARK_COLORS.accentLight,
  },
  landmarkDatePillYear: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: LANDMARK_COLORS.accent,
  },
  landmarkVenueText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    textAlign: 'right',
    flexShrink: 1,
    color: LANDMARK_COLORS.accentLight,
  },

  // Other card styles
  otherTitle: {
    fontFamily: FONTS.zain,
    fontSize: 20,
    color: OTHER_COLORS.accent,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  otherDatePill: {
    borderWidth: 1,
    borderColor: OTHER_COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  otherDatePillMonth: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: OTHER_COLORS.accentLight,
  },
  otherDatePillYear: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: OTHER_COLORS.accent,
  },
  otherVenueText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    textAlign: 'right',
    flexShrink: 1,
    color: OTHER_COLORS.accentLight,
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
