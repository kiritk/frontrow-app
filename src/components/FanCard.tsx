import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_ASPECT = 1.3;

interface FanCardProps {
  firstName: string;
  lastName: string;
  profileImage: string | null;
  fanLevel: string;
  eventCount: number;
  cityCount: number;
  venueCount: number;
  sportsCount: number;
}

export default function FanCard({
  firstName,
  lastName,
  profileImage,
  fanLevel,
  eventCount,
  cityCount,
  venueCount,
  sportsCount,
}: FanCardProps) {
  const initials =
    (firstName?.[0] || '').toUpperCase() + (lastName?.[0] || '').toUpperCase() || '?';

  return (
    <View style={styles.cardOuter}>
      <LinearGradient
        colors={['#0a1628', '#111d33', '#0d1a2e']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Subtle grid overlay */}
        <View style={styles.gridOverlay}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={`h${i}`}
              style={[
                styles.gridLineH,
                { top: `${(i + 1) * 12}%` },
              ]}
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={`v${i}`}
              style={[
                styles.gridLineV,
                { left: `${(i + 1) * 16}%` },
              ]}
            />
          ))}
        </View>

        {/* Top row: fan status + event number */}
        <View style={styles.topRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{fanLevel.toUpperCase()}</Text>
          </View>
          <View style={styles.eventNumberContainer}>
            <Text style={styles.eventNumberHash}>#{eventCount}</Text>
            <Text style={styles.eventNumberLabel}>events</Text>
          </View>
        </View>

        {/* Left vertical text */}
        <View style={styles.verticalTextContainer}>
          <View style={styles.verticalDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <View style={styles.verticalLine} />
          <Text style={styles.verticalText}>FRONT ROW FAN</Text>
          <View style={styles.verticalLine} />
        </View>

        {/* Center avatar */}
        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          {!profileImage && (
            <Text style={styles.dropPhotoText}>— DROP PHOTO HERE —</Text>
          )}
        </View>

        {/* Name block */}
        <View style={styles.nameContainer}>
          <Text style={styles.firstName}>{(firstName || 'FIRST').toUpperCase()}</Text>
          <Text style={styles.lastName}>{(lastName || 'LAST').toUpperCase()}</Text>
        </View>

        {/* Bottom stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{eventCount}</Text>
            <Text style={styles.statLabel}>EVENTS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{cityCount}</Text>
            <Text style={styles.statLabel}>CITIES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{venueCount}</Text>
            <Text style={styles.statLabel}>VENUES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sportsCount}</Text>
            <Text style={styles.statLabel}>SPORTS</Text>
          </View>
        </View>

        {/* Watermark */}
        <Text style={styles.watermark}>FRONT ROW</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    width: CARD_WIDTH,
    aspectRatio: 1 / CARD_ASPECT,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(90,120,180,0.25)',
    borderRadius: 18,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(90,120,180,0.08)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(90,120,180,0.08)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    backgroundColor: 'rgba(30,58,95,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(90,120,180,0.4)',
  },
  statusText: {
    fontFamily: FONTS.vt323,
    fontSize: 16,
    color: '#7b9ed6',
    letterSpacing: 2,
  },
  eventNumberContainer: {
    alignItems: 'flex-end',
  },
  eventNumberHash: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    color: '#7b9ed6',
    lineHeight: 38,
  },
  eventNumberLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: 'rgba(123,158,214,0.6)',
    marginTop: -2,
  },
  verticalTextContainer: {
    position: 'absolute',
    left: 20,
    top: 80,
    bottom: 100,
    alignItems: 'center',
    width: 16,
  },
  verticalDots: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7b9ed6',
  },
  verticalLine: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(90,120,180,0.3)',
  },
  verticalText: {
    fontFamily: FONTS.vt323,
    fontSize: 12,
    color: 'rgba(123,158,214,0.5)',
    letterSpacing: 3,
    transform: [{ rotate: '-90deg' }],
    width: 120,
    textAlign: 'center',
    marginVertical: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(90,120,180,0.5)',
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(30,58,95,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(90,120,180,0.4)',
  },
  avatarInitials: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    color: '#7b9ed6',
  },
  dropPhotoText: {
    fontFamily: FONTS.vt323,
    fontSize: 13,
    color: 'rgba(123,158,214,0.35)',
    marginTop: 10,
    letterSpacing: 2,
  },
  nameContainer: {
    marginBottom: 12,
  },
  firstName: {
    fontFamily: FONTS.bold,
    fontSize: 38,
    color: '#FFFFFF',
    lineHeight: 42,
    letterSpacing: 1,
  },
  lastName: {
    fontFamily: FONTS.bold,
    fontSize: 38,
    color: '#7b9ed6',
    lineHeight: 42,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(90,120,180,0.2)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(90,120,180,0.2)',
  },
  statNumber: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: FONTS.vt323,
    fontSize: 11,
    color: 'rgba(123,158,214,0.6)',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  watermark: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    fontFamily: FONTS.vt323,
    fontSize: 14,
    color: 'rgba(123,158,214,0.12)',
    letterSpacing: 6,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
});
