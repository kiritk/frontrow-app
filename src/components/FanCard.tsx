import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Line, Defs, LinearGradient as SvgLinearGradient, Stop, Circle, G } from 'react-native-svg';
import { FONTS } from '../theme/colors';

const CONCERT_BG = require('../../assets/images/concert_bg.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

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

type TierKey = 'Rookie' | 'Pro' | 'All-Star' | 'Legend';

const TIERS: { key: TierKey; label: string; range: string; min: number; max: number; color: string }[] = [
  { key: 'Rookie',   label: 'Rookie',   range: '0 – 9',  min: 0,  max: 10, color: '#3B82F6' },
  { key: 'Pro',      label: 'Pro',      range: '10 – 24', min: 10, max: 25, color: '#EF4444' },
  { key: 'All-Star', label: 'All-Star', range: '25 – 49', min: 25, max: 50, color: '#22C55E' },
  { key: 'Legend',   label: 'Legend',   range: '50+',    min: 50, max: Infinity, color: '#F59E0B' },
];

function findTier(name: string) {
  return TIERS.find(t => t.key === name) ?? TIERS[0];
}

function computeOverallProgress(eventCount: number) {
  // Map 0..50 events linearly to 0..1; anything past Legend pegs at 1.
  return Math.min(1, eventCount / 50);
}

// ── Hero illustration (stage trusses + crowd) ───────────────────────────────
function HeroArt({ width, height, color = 'rgba(180,140,220,0.55)' }: { width: number; height: number; color?: string }) {
  // Two stage trusses framing the big number. All line work, no fills.
  const stroke = color;
  const strokeWidth = 2;
  const trussW = width * 0.18;
  const trussH = height * 0.55;
  const baseY = height * 0.78;
  const leftX = width * 0.12;
  const rightX = width - leftX - trussW;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
      <Defs>
        <SvgLinearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgba(160,110,200,0.0)" />
          <Stop offset="1" stopColor="rgba(160,110,200,0.35)" />
        </SvgLinearGradient>
      </Defs>

      {/* Light beams from stage trusses */}
      <Path d={`M ${leftX + trussW / 2} ${baseY - trussH * 0.05} L ${width * 0.1} ${height}`} stroke={stroke} strokeWidth={1} opacity={0.25} />
      <Path d={`M ${leftX + trussW / 2} ${baseY - trussH * 0.05} L ${width * 0.35} ${height}`} stroke={stroke} strokeWidth={1} opacity={0.25} />
      <Path d={`M ${rightX + trussW / 2} ${baseY - trussH * 0.05} L ${width * 0.65} ${height}`} stroke={stroke} strokeWidth={1} opacity={0.25} />
      <Path d={`M ${rightX + trussW / 2} ${baseY - trussH * 0.05} L ${width * 0.9} ${height}`} stroke={stroke} strokeWidth={1} opacity={0.25} />

      {/* Left truss */}
      <Truss x={leftX} y={baseY - trussH} w={trussW} h={trussH} stroke={stroke} sw={strokeWidth} />
      {/* Right truss */}
      <Truss x={rightX} y={baseY - trussH} w={trussW} h={trussH} stroke={stroke} sw={strokeWidth} />

      {/* Stage floor line */}
      <Line x1={0} y1={baseY} x2={width} y2={baseY} stroke={stroke} strokeWidth={1.5} />

      {/* Crowd silhouette (stylized humps) */}
      <CrowdLine y={baseY} width={width} stroke={stroke} />
    </Svg>
  );
}

function Truss({ x, y, w, h, stroke, sw }: { x: number; y: number; w: number; h: number; stroke: string; sw: number }) {
  // Vertical I-beam style truss with X-bracing inside.
  const segments = 5;
  const segH = h / segments;
  return (
    <G>
      <Line x1={x} y1={y} x2={x} y2={y + h} stroke={stroke} strokeWidth={sw} />
      <Line x1={x + w} y1={y} x2={x + w} y2={y + h} stroke={stroke} strokeWidth={sw} />
      {/* Cross bracing */}
      {Array.from({ length: segments }).map((_, i) => {
        const y0 = y + i * segH;
        const y1 = y + (i + 1) * segH;
        return (
          <G key={i}>
            <Line x1={x} y1={y0} x2={x + w} y2={y1} stroke={stroke} strokeWidth={1} opacity={0.7} />
            <Line x1={x + w} y1={y0} x2={x} y2={y1} stroke={stroke} strokeWidth={1} opacity={0.7} />
            <Line x1={x} y1={y1} x2={x + w} y2={y1} stroke={stroke} strokeWidth={0.8} opacity={0.5} />
          </G>
        );
      })}
      {/* Light fixtures at top */}
      <Circle cx={x + w * 0.3} cy={y + 4} r={2} fill={stroke} opacity={0.6} />
      <Circle cx={x + w * 0.7} cy={y + 4} r={2} fill={stroke} opacity={0.6} />
    </G>
  );
}

function CrowdLine({ y, width, stroke }: { y: number; width: number; stroke: string }) {
  // Generate a row of rounded "heads" along the floor line.
  const heads: React.ReactElement[] = [];
  let x = 4;
  let i = 0;
  while (x < width - 4) {
    const r = 4 + ((i * 7) % 5);
    heads.push(<Circle key={`h${i}`} cx={x + r} cy={y - r * 0.4} r={r} stroke={stroke} strokeWidth={1} fill="none" opacity={0.55} />);
    x += r * 2 + 2;
    i += 1;
  }
  return <G>{heads}</G>;
}

// ── Decorative barcode ──────────────────────────────────────────────────────
function Barcode({ width, height = 36 }: { width: number; height?: number }) {
  // Deterministic but irregular-looking bar pattern.
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

// ── Main component ─────────────────────────────────────────────────────────
export default function FanCard({
  firstName, lastName, profileImage, fanLevel,
  eventCount, cityCount, venueCount, yearCount,
}: FanCardProps) {
  const tier = findTier(fanLevel);
  const overall = computeOverallProgress(eventCount);
  const nextTier = TIERS[TIERS.findIndex(t => t.key === tier.key) + 1];
  const eventsToNext = nextTier ? nextTier.min - eventCount : 0;

  const hue = tier.color;

  return (
    <View style={styles.card}>
      {/* ──────────── TOP STUB ──────────── */}
      <View style={styles.stub}>
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
          {tier.key.toUpperCase()}
        </Text>

        {nextTier ? (
          <View style={styles.nextPill}>
            <MaterialCommunityIcons name="crown-outline" size={18} color="#B388FF" style={{ marginRight: 8 }} />
            <Text style={styles.nextText}>
              {eventsToNext} more events to{' '}
              <Text style={[styles.nextHighlight, { color: nextTier.color }]}>{nextTier.key}</Text>
            </Text>
          </View>
        ) : (
          <View style={styles.nextPill}>
            <MaterialCommunityIcons name="crown" size={18} color="#FBBF24" style={{ marginRight: 8 }} />
            <Text style={styles.nextText}>You're at max level</Text>
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${overall * 100}%`, backgroundColor: hue }]} />
        </View>

        {/* Tier dots row */}
        <View style={styles.tierRow}>
          {TIERS.map(t => (
            <View key={t.key} style={styles.tierCol}>
              <View style={[styles.tierDot, { backgroundColor: t.color }]} />
              <Text style={[styles.tierLabel, t.key === tier.key && { color: '#FFFFFF', fontFamily: FONTS.semiBold }]}>
                {t.label}
              </Text>
              <Text style={styles.tierRange}>{t.range}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ──────────── PERFORATION ──────────── */}
      <View style={styles.perfRow}>
        <View style={[styles.perfCircle, styles.perfLeft]} />
        <View style={styles.perfLine}>
          {Array.from({ length: 28 }).map((_, i) => (
            <View key={i} style={styles.perfDash} />
          ))}
        </View>
        <View style={[styles.perfCircle, styles.perfRight]} />
      </View>

      {/* ──────────── BOTTOM MAIN ──────────── */}
      <View style={styles.main}>
        {/* Hero block with SVG line art */}
        <View style={styles.heroBlock}>
          <HeroArt width={CARD_WIDTH} height={220} />
          <View style={styles.heroCenter} pointerEvents="none">
            <Text style={styles.heroNumber}>{eventCount}</Text>
            <Text style={styles.heroLabel}>EVENTS ATTENDED</Text>
          </View>
        </View>

        {/* Dashed divider */}
        <View style={styles.dashRow}>
          {Array.from({ length: 28 }).map((_, i) => (
            <View key={i} style={styles.dashDash} />
          ))}
        </View>

        {/* 2×2 stat grid */}
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

        {/* Barcode + footer text */}
        <View style={styles.barcodeWrap}>
          <Barcode width={CARD_WIDTH * 0.7} />
        </View>
        <Text style={styles.footerLine1}>THANK YOU FOR BEING</Text>
        <Text style={styles.footerLine2}>PART OF THE EXPERIENCE!</Text>
      </View>
    </View>
  );
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

const TICKET_BG = '#0B1538'; // deep navy
const TICKET_BORDER = 'rgba(120,90,200,0.45)';

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: TICKET_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TICKET_BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },

  // ── Top stub ────────────────────────────────────────────────────────────
  stub: {
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 22,
    alignItems: 'center',
    overflow: 'hidden',
  },
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
    fontSize: 80,
    letterSpacing: 2,
    marginTop: 6,
    marginBottom: 14,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  nextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50,30,90,0.55)',
    borderColor: 'rgba(150,110,220,0.45)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    marginBottom: 16,
  },
  nextText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  nextHighlight: {
    fontFamily: FONTS.bold,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  tierCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  tierLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  tierRange: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
  },

  // ── Perforation ─────────────────────────────────────────────────────────
  perfRow: {
    height: 22,
    backgroundColor: TICKET_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    position: 'relative',
  },
  perfCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#000',
  },
  perfLeft: {
    marginLeft: -11,
  },
  perfRight: {
    marginRight: -11,
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

  // ── Bottom main ─────────────────────────────────────────────────────────
  main: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 22,
  },
  heroBlock: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNumber: {
    fontFamily: FONTS.bold,
    fontSize: 140,
    color: '#FFFFFF',
    lineHeight: 140,
    letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  heroLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    letterSpacing: 6,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  dashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 18,
  },
  dashDash: {
    width: 6,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  statGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
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
