import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, COLORS } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.42); // trading card 2.5×3.5 ratio

interface FanCardProps {
  firstName: string;
  lastName: string;
  profileImage: string | null;
  fanLevel: string;
  eventCount: number;
  cityCount: number;
  venueCount: number;
  yearCount: number;
}

const LEVEL_CONFIG: Record<string, { color: string; dark: string; emoji: string }> = {
  Rookie:     { color: '#2563EB', dark: '#1E40AF', emoji: '⚾' },
  Pro:        { color: '#DC2626', dark: '#991B1B', emoji: '🏟️' },
  'All-Star': { color: '#16A34A', dark: '#166534', emoji: '⭐' },
  Legend:     { color: '#D97706', dark: '#92400E', emoji: '👑' },
};

export default function FanCard({
  firstName, lastName, profileImage, fanLevel,
  eventCount, cityCount, venueCount, yearCount,
}: FanCardProps) {
  const initials = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '??';
  const lvl = LEVEL_CONFIG[fanLevel] ?? LEVEL_CONFIG['Rookie'];
  const first = (firstName || 'YOUR').toUpperCase();
  const last  = (lastName  || 'NAME').toUpperCase();
  const nick  = fanLevel.toUpperCase();

  const stats = [
    { label: 'EVT', value: eventCount },
    { label: 'CTY', value: cityCount  },
    { label: 'VEN', value: venueCount },
    { label: 'YRS', value: yearCount  },
  ];

  return (
    // ── Outer dark frame (like the thick border of a real card) ──
    <View style={[styles.outerFrame, { shadowColor: lvl.color }]}>

      {/* Gold inner border */}
      <View style={styles.innerFrame}>
        <View style={styles.card}>

          {/* ── TOP BANNER ── */}
          <LinearGradient
            colors={['#6B0E0E', '#A81515', '#6B0E0E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topBanner}
          >
            {/* Decorative diamonds */}
            <View style={styles.bannerDecor}>
              {[0, 1, 2].map(i => <View key={i} style={styles.diamond} />)}
            </View>

            <Text style={styles.teamName}>FRONT ROW</Text>

            {/* FR® badge — like the Topps® mark */}
            <View style={styles.frBadge}>
              <Text style={styles.frText}>FR</Text>
              <Text style={styles.frReg}>®</Text>
            </View>
          </LinearGradient>

          {/* Gold separator */}
          <View style={styles.goldLine} />

          {/* ── PHOTO AREA ── */}
          <View style={styles.photoArea}>
            {profileImage ? (
              <>
                <Image
                  source={{ uri: profileImage }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
                {/* Vignette so emblem + number pop */}
                <LinearGradient
                  colors={['rgba(0,0,0,0.32)', 'transparent', 'rgba(0,0,0,0.58)']}
                  locations={[0, 0.42, 1]}
                  style={StyleSheet.absoluteFill}
                />
              </>
            ) : (
              /* Aged-paper placeholder */
              <LinearGradient
                colors={['#c0995a', '#9a7030', '#785020']}
                style={styles.placeholderBg}
              >
                {/* Scan-line texture */}
                {Array.from({ length: 9 }).map((_, i) => (
                  <View key={i} style={[styles.agingLine, { top: 10 + i * 34 }]} />
                ))}
                <View style={styles.placeholderCenter}>
                  <Text style={styles.placeholderInitials}>{initials}</Text>
                  <Text style={styles.placeholderHint}>NO PHOTO ON FILE</Text>
                </View>
              </LinearGradient>
            )}

            {/* ── Fan-level emblem (top-left) ── */}
            <View style={[styles.emblemRing, { shadowColor: lvl.color }]}>
              <LinearGradient colors={[lvl.color, lvl.dark]} style={styles.emblemFill}>
                <Text style={styles.emblemEmoji}>{lvl.emoji}</Text>
                <Text style={styles.emblemLabel}>{nick}</Text>
              </LinearGradient>
            </View>

            {/* ── Card number (top-right) ── */}
            <Text style={styles.cardNum}>
              {String(eventCount).padStart(2, '0')}
            </Text>
          </View>

          {/* Gold separator */}
          <View style={styles.goldLine} />

          {/* ── NAME BANNER ── */}
          <LinearGradient
            colors={['#5a0000', '#A31515', '#5a0000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nameBanner}
          >
            <Text style={styles.nameText} numberOfLines={1}>
              {first}{' "'}
              <Text style={styles.nameNick}>{nick}</Text>
              {'" '}{last}
            </Text>
          </LinearGradient>

          {/* ── STATS BAR ── */}
          <LinearGradient
            colors={['#8a6000', '#D4A017', '#8a6000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statsBar}
          >
            {stats.map((s, i) => (
              <React.Fragment key={s.label}>
                <Text style={styles.statText}>{s.label}: {s.value}</Text>
                {i < stats.length - 1 && <View style={styles.statDiv} />}
              </React.Fragment>
            ))}
          </LinearGradient>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Frame ──────────────────────────────────────────────────────────
  outerFrame: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    backgroundColor: '#1C0A00',
    padding: 5,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.65,
    shadowRadius: 24,
    elevation: 18,
  },
  innerFrame: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C8972A',
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    backgroundColor: '#EDD9A3',
  },

  // ── Top banner ─────────────────────────────────────────────────────
  topBanner: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  bannerDecor: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  diamond: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{ rotate: '45deg' }],
  },
  teamName: {
    flex: 1,
    fontFamily: FONTS.audiowide,
    fontSize: 19,
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  frBadge: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    position: 'relative',
  },
  frText: {
    fontFamily: FONTS.tourney,
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 19,
  },
  frReg: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontFamily: FONTS.regular,
    fontSize: 7,
    color: 'rgba(255,255,255,0.6)',
  },

  // ── Gold separator ─────────────────────────────────────────────────
  goldLine: {
    height: 3,
    backgroundColor: '#C8972A',
  },

  // ── Photo area ─────────────────────────────────────────────────────
  photoArea: {
    flex: 1,
    backgroundColor: '#8a7050',
    overflow: 'hidden',
  },
  placeholderBg: {
    flex: 1,
  },
  agingLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  placeholderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitials: {
    fontFamily: FONTS.tourney,
    fontSize: 92,
    color: 'rgba(255,255,255,0.12)',
    lineHeight: 98,
  },
  placeholderHint: {
    fontFamily: FONTS.vt323,
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 4,
    marginTop: 6,
  },

  // ── Fan-level emblem ───────────────────────────────────────────────
  emblemRing: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#C8972A',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 8,
  },
  emblemFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  emblemEmoji: {
    fontSize: 28,
  },
  emblemLabel: {
    fontFamily: FONTS.vt323,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },

  // ── Card number ────────────────────────────────────────────────────
  cardNum: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontFamily: FONTS.tourney,
    fontSize: 46,
    color: '#FFFFFF',
    lineHeight: 50,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },

  // ── Name banner ────────────────────────────────────────────────────
  nameBanner: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  nameText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  nameNick: {
    color: '#FFD700',
  },

  // ── Stats bar ──────────────────────────────────────────────────────
  statsBar: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  statText: {
    fontFamily: FONTS.geistMonoBold,
    fontSize: 12,
    color: '#1C0A00',
    letterSpacing: 0.4,
  },
  statDiv: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
});
