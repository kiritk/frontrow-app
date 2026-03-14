import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONTS } from '../theme/colors';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    type: string;
    sport?: string;
    venue: string;
    venue_location?: string;
    date: string;
  };
  onDelete: () => void;
}

export default function EventCard({ event, onDelete }: EventCardProps) {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - 48 - 12) / 2; // padding (24*2) + gap (12)
  const CARD_HEIGHT = CARD_WIDTH * 1.3;

  const confirmDelete = () => {
    Alert.alert('Delete Event', `Delete "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  const getGradientColors = (): [string, string] => {
    switch (event.type) {
      case 'concert': return ['#1a1a2e', '#4a1a6b'];
      case 'sports':
        if (event.sport === 'nfl') return ['#1e3a5f', '#2d5a8f'];
        if (event.sport === 'mlb') return ['#d35400', '#c0392b'];
        if (event.sport === 'nba') return ['#c0392b', '#e74c3c'];
        if (event.sport === 'soccer') return ['#27ae60', '#2ecc71'];
        if (event.sport === 'tennis') return ['#2c3e50', '#34495e'];
        return ['#1e3a5f', '#3498db'];
      case 'theater': return ['#8e44ad', '#9b59b6'];
      case 'comedy': return ['#c0392b', '#e74c3c'];
      case 'landmark': return ['#16a085', '#1abc9c'];
      default: return ['#2c3e50', '#34495e'];
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

  return (
    <TouchableOpacity 
      onLongPress={confirmDelete} 
      activeOpacity={0.9} 
      style={[styles.cardWrapper, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
    >
      <View style={styles.card}>
        <View style={styles.perforationTopLeft} />
        <View style={styles.perforationTopRight} />

        <LinearGradient
          colors={getGradientColors()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.imageArea}>
            <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{month} {day}</Text>
              <Text style={styles.yearText}>{year}</Text>
            </View>

            <View style={styles.venueContainer}>
              <Text style={styles.venueIcon}>📍</Text>
              <Text style={styles.venueName} numberOfLines={2}>{event.venue}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  perforationTopLeft: {
    position: 'absolute',
    left: -12,
    top: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    zIndex: 10,
  },
  perforationTopRight: {
    position: 'absolute',
    right: -12,
    top: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    zIndex: 10,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  eventTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  dateText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.navy,
    letterSpacing: 0.5,
  },
  yearText: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.gray,
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  venueIcon: {
    fontSize: 10,
    marginRight: 2,
  },
  venueName: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.white,
    textAlign: 'right',
    flexShrink: 1,
  },
});
