import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS } from '../theme/colors';

const CONCERT_BG = require('../../assets/images/concert_bg.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PERF_RADIUS = 14;
const WRAPPER_WIDTH = SCREEN_WIDTH - 48;
// The visible ticket is narrower than the wrapper because PERF_RADIUS of room
// is reserved on each side for the white half-circle bumps to poke into.
const CARD_WIDTH = WRAPPER_WIDTH - PERF_RADIUS * 2;

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

const TIER_COLORS: Record<string, string> = {
  Rookie:     '#3B82F6',
  Pro:        '#EF4444',
  'All-Star': '#22C55E',
  Legend:     '#F59E0B',
};

function Barcode({ width, height = 36 }: { width: number; height?: number }) {
  const seed = 'frontrow';
  const bars: React.ReactElement[] = [];
  let cursor = 0;
  let i = 0;
  while (cursor < width) {
    const code = seed.charCodeAt(i % seed.length);
    const barW = 1 + (code % 4);
    const gap = 1 + ((code >> 2) % 3);
    bars.push(
      <View
        key={`b${i}`}
        style={{
          position: 'absolute',
          left: cursor,
          top: 0,
          width: barW,
          height,
          backgroundColor: 'rgba(180,140,220,0.85)',
        }}
      />,
    );
    cursor += barW + gap;
    i += 1;
  }
  return <View style={{ width, height, position: 'relative' }}>{bars}</View>;
}

function StatCell({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <View style={styles.statCell}>
      <View style={styles.statIcon}>{icon}</View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function FanCard({
  fanLevel,
  eventCount, cityCount, venueCount, yearCount,
}: FanCardProps) {
  const hue = TIER_COLORS[fanLevel] ?? TIER_COLORS.Rookie;

  return (
    <View style={styles.wrapper}>
      {/* ── Top half (rounded top corners only) ── */}
      <View style={styles.cardTop}>
        <Image source={CONCERT_BG} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(15,20,55,0.92)', 'rgba(28,18,60,0.85)', 'rgba(60,15,55,0.85)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.fanLevelPill}>
          <Ionicons name="star" size={11} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.fanLevelLabel}>FAN LEVEL</Text>
        </View>

        <Text
          style={[styles.tierName, { color: hue }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {fanLevel.toUpperCase()}
        </Text>
      </View>

      {/* ── Perforation strip with white half-circle bumps that poke outside ── */}
      <View style={styles.perfStrip}>
        <View style={[styles.perfBump, styles.perfBumpLeft]} />
        <View style={styles.perfLine}>
          {Array.from({ length: 26 }).map((_, i) => (
            <View key={i} style={styles.perfDash} />
          ))}
        </View>
        <View style={[styles.perfBump, styles.perfBumpRight]} />
      </View>

      {/* ── Bottom half (rounded bottom corners only) ── */}
      <View style={styles.cardBottom}>
        <View style={styles.statGrid}>
          <StatCell icon={<Ionicons name="ticket-outline" size={34} color="#B388FF" />} value={eventCount} label={'EVENTS\nATTENDED'} />
          <View style={styles.statDivider} />
          <StatCell icon={<MaterialCommunityIcons name="office-building-outline" size={34} color="#60A5FA" />} value={cityCount} label={'CITIES\nEXPLORED'} />
        </View>
        <View style={styles.statRowDivider} />
        <View style={styles.statGrid}>
          <StatCell icon={<MaterialCommunityIcons name="stadium-outline" size={34} color="#4ADE80" />} value={venueCount} label={'VENUES\nVISITED'} />
          <View style={styles.statDivider} />
          <StatCell icon={<Ionicons name="calendar-outline" size={34} color="#FBBF24" />} value={yearCount} label={'YEARS\nWITH US'} />
        </View>

        <View style={styles.barcodeWrap}>
          <Barcode width={CARD_WIDTH * 0.7} />
        </View>
        <Text style={styles.footerLine1}>THANK YOU FOR BEING</Text>
        <Text style={styles.footerLine2}>PART OF THE EXPERIENCE!</Text>
      </View>
    </View>
  );
}

const TICKET_BG = '#0B1538';
const TICKET_BORDER = 'rgba(120,90,200,0.45)';
const PERF_STRIP_HEIGHT = PERF_RADIUS * 2 + 4;

const styles = StyleSheet.create({
  wrapper: {
    width: WRAPPER_WIDTH,
    alignSelf: 'center',
  },

  // ── Card halves ─────────────────────────────────────────────────────────
  cardTop: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    backgroundColor: TICKET_BG,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: TICKET_BORDER,
    overflow: 'hidden',
    paddingTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 26,
    alignItems: 'center',
  },
  cardBottom: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    backgroundColor: TICKET_BG,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: TICKET_BORDER,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
  },

  // ── Top stub content ────────────────────────────────────────────────────
  fanLevelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  fanLevelLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    letterSpacing: 3,
    color: '#FFFFFF',
  },
  tierName: {
    fontFamily: FONTS.bold,
    fontSize: 96,
    letterSpacing: 2,
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },

  // ── Perforation strip ───────────────────────────────────────────────────
  perfStrip: {
    width: CARD_WIDTH,
    height: PERF_STRIP_HEIGHT,
    alignSelf: 'center',
    backgroundColor: TICKET_BG,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: TICKET_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  perfLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 6,
  },
  perfDash: {
    width: 6,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  // White half-circles whose centers sit exactly on each card edge.
  perfBump: {
    position: 'absolute',
    width: PERF_RADIUS * 2,
    height: PERF_RADIUS * 2,
    borderRadius: PERF_RADIUS,
    backgroundColor: '#FFFFFF',
    top: (PERF_STRIP_HEIGHT - PERF_RADIUS * 2) / 2,
  },
  perfBumpLeft: {
    left: -PERF_RADIUS,
  },
  perfBumpRight: {
    right: -PERF_RADIUS,
  },

  // ── Bottom main content ─────────────────────────────────────────────────
  statGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  statIcon: {
    width: 40,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: 30,
    color: '#FFFFFF',
    lineHeight: 32,
  },
  statLabel: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: '70%',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statRowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  barcodeWrap: {
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 14,
  },
  footerLine1: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  footerLine2: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginTop: 2,
  },
});
