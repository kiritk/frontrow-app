import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { FONTS } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH  = Math.round(SCREEN_WIDTH * 0.88);
const CARD_HEIGHT = Math.round(CARD_WIDTH / 0.72);

const FOOTER_H  = Math.round(CARD_HEIGHT * 0.175);
const AVATAR_SZ = Math.round(CARD_WIDTH  * 0.52);

// ── Vintage palette ─────────────────────────────────────────────────────────
const NAVY   = '#0D2A52';
const CREAM  = '#F3EFE6';
const V_RED  = '#B53A3A';
const L_BLUE = '#C5D8F0';
const M_BLUE = '#8AAAE0';

const LEVEL_RIBBON: Record<string, [string, string]> = {
  Rookie:     ['#1C4E94', '#0E3170'],
  Pro:        ['#B53A3A', '#7A1A1A'],
  'All-Star': ['#1A8740', '#116030'],
  Legend:     ['#C87D0E', '#966009'],
};

const STADIUM = require('../../assets/images/mlb/stadiums/angels.jpg');

// ── Diagonal panel coordinates ───────────────────────────────────────────────
const W = CARD_WIDTH;
const H = CARD_HEIGHT;

// Main light-blue band
const BAND_POINTS = [
  `0,${Math.round(H * 0.07)}`,
  `${W},0`,
  `${W},${Math.round(H * 0.605)}`,
  `0,${Math.round(H * 0.645)}`,
].join(' ');

// Thin white stripe at bottom of blue band
const STRIPE_POINTS = [
  `0,${Math.round(H * 0.628)}`,
  `${W},${Math.round(H * 0.588)}`,
  `${W},${Math.round(H * 0.615)}`,
  `0,${Math.round(H * 0.655)}`,
].join(' ');

// ── Component ────────────────────────────────────────────────────────────────
interface Props {
  firstName:    string;
  lastName:     string;
  profileImage: string | null;
  fanLevel:     string;
  eventCount:   number;
  cityCount:    number;
  venueCount:   number;
  yearCount:    number;
}

export default function TradingCardProfile({
  firstName, lastName, profileImage, fanLevel,
  eventCount, cityCount, venueCount, yearCount,
}: Props) {
  const first = (firstName || 'YOUR').toUpperCase();
  const last  = (lastName  || 'NAME').toUpperCase();
  const level = fanLevel || 'Rookie';
  const [rib1, rib2] = LEVEL_RIBBON[level] ?? LEVEL_RIBBON.Rookie;

  const avatarTop  = Math.round(H * 0.09);
  const avatarLeft = Math.round((W - AVATAR_SZ - 14) / 2);
  const nameTop    = Math.round(H * 0.635);
  const nameH      = H - FOOTER_H - nameTop - 4;

  const RIBBON_H = 36;
  const BADGE_W  = 62;

  const stats = [
    { label: 'EVENTS', value: eventCount },
    { label: 'CITIES', value: cityCount  },
    { label: 'VENUES', value: venueCount },
    { label: 'YEARS',  value: yearCount  },
  ];

  return (
    <View style={styles.card}>

      {/* ── 1. CREAM PAPER BASE ─────────────────────────────────────── */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: CREAM }]} />

      {/* ── 2. GRAIN TEXTURE ────────────────────────────────────────── */}
      <Svg
        style={StyleSheet.absoluteFillObject}
        width={W} height={H}
        pointerEvents="none"
      >
        <Defs>
          <Pattern id="grain" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <Rect width="6" height="6" fill="none" />
            <Circle cx="1"   cy="1"   r="0.7" fill="rgba(55,35,10,0.07)" />
            <Circle cx="4"   cy="2.5" r="0.5" fill="rgba(55,35,10,0.05)" />
            <Circle cx="1.5" cy="4.5" r="0.55" fill="rgba(55,35,10,0.06)" />
            <Circle cx="4.5" cy="5"   r="0.4" fill="rgba(55,35,10,0.04)" />
          </Pattern>
        </Defs>
        <Rect width={W} height={H} fill="url(#grain)" />
      </Svg>

      {/* ── 3. STADIUM IMAGE (faded, blue-tinted) ───────────────────── */}
      <Image source={STADIUM} style={styles.stadiumBg} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(14,49,112,0.32)', 'rgba(14,49,112,0.14)', 'rgba(14,49,112,0)']}
        locations={[0, 0.55, 1]}
        style={[StyleSheet.absoluteFillObject, { height: H * 0.70 }]}
        pointerEvents="none"
      />

      {/* ── 4. DIAGONAL PANELS ──────────────────────────────────────── */}
      <Svg
        style={StyleSheet.absoluteFillObject}
        width={W} height={H}
        pointerEvents="none"
      >
        <Polygon points={BAND_POINTS}   fill={L_BLUE}              opacity="0.80" />
        <Polygon points={BAND_POINTS}   fill={M_BLUE}              opacity="0.18" />
        <Polygon points={STRIPE_POINTS} fill="rgba(255,255,255,0.65)" opacity="1" />
      </Svg>

      {/* ── 5. VERTICAL "FRONT ROW FAN" ─────────────────────────────── */}
      <Text
        style={[styles.vertText, {
          left: -Math.round(H * 0.38 / 2) + 13,
          top:  Math.round(H * 0.36),
          width: Math.round(H * 0.38),
        }]}
        pointerEvents="none"
      >
        FRONT ROW FAN
      </Text>

      {/* ── 6. LEFT STARS ───────────────────────────────────────────── */}
      <View style={[styles.leftStars, { top: Math.round(H * 0.24) }]} pointerEvents="none">
        {[0, 1, 2].map(i => <Text key={i} style={styles.leftStar}>★</Text>)}
      </View>

      {/* ── 7. ROOKIE RIBBON (top-left) ─────────────────────────────── */}
      <View style={[styles.ribbonRow, { top: Math.round(H * 0.065) }]}>
        <LinearGradient
          colors={[rib1, rib2]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.ribbonBody, { height: RIBBON_H }]}
        >
          <Text style={styles.ribbonText}>{level.toUpperCase()}</Text>
        </LinearGradient>
        {/* Right-pointing arrow */}
        <View style={[styles.ribbonArrow, {
          borderTopWidth:    RIBBON_H / 2,
          borderBottomWidth: RIBBON_H / 2,
          borderLeftWidth:   13,
          borderLeftColor:   rib2,
        }]} />
      </View>

      {/* ── 8. NUMBER BADGE (top-right) ─────────────────────────────── */}
      <View style={[styles.badgeWrapper, { width: BADGE_W }]}>
        <LinearGradient colors={[V_RED, '#7A1A1A']} style={styles.badgeBody}>
          <Text style={styles.badgeText}>#{eventCount}</Text>
        </LinearGradient>
        {/* Bottom-pointing arrow */}
        <View style={[styles.badgeArrow, {
          borderLeftWidth:  BADGE_W / 2,
          borderRightWidth: BADGE_W / 2,
          borderTopWidth:   14,
          borderTopColor:   '#7A1A1A',
        }]} />
      </View>

      {/* ── 9. AVATAR CIRCLE ────────────────────────────────────────── */}
      {/* Outer cream ring */}
      <View style={[styles.avatarOuter, {
        width:        AVATAR_SZ + 18,
        height:       AVATAR_SZ + 18,
        borderRadius: (AVATAR_SZ + 18) / 2,
        top:          avatarTop,
        left:         avatarLeft,
      }]}>
        {/* Dark navy inner ring */}
        <View style={[styles.avatarRing, {
          width:        AVATAR_SZ + 6,
          height:       AVATAR_SZ + 6,
          borderRadius: (AVATAR_SZ + 6) / 2,
        }]}>
          {/* Avatar fill */}
          <View style={[styles.avatarFill, {
            width:        AVATAR_SZ,
            height:       AVATAR_SZ,
            borderRadius: AVATAR_SZ / 2,
          }]}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{ width: AVATAR_SZ, height: AVATAR_SZ, borderRadius: AVATAR_SZ / 2 }}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { borderRadius: AVATAR_SZ / 2 }]}>
                <Text style={styles.avatarQ}>?</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── 10. DROP PHOTO LABEL ────────────────────────────────────── */}
      {!profileImage && (
        <View style={[styles.dropRow, {
          top: avatarTop + AVATAR_SZ + 22,
        }]}>
          <Text style={styles.dropStars}>★ ★ ★</Text>
          <View style={styles.dropBadge}>
            <Text style={styles.dropText}>DROP PHOTO HERE</Text>
          </View>
          <Text style={styles.dropStars}>★ ★ ★</Text>
        </View>
      )}

      {/* ── 11. NAME BLOCK ──────────────────────────────────────────── */}
      <View style={[styles.nameBlock, { top: nameTop, height: nameH }]}>
        <Text
          style={styles.nameFirst}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.45}
        >
          {first}
        </Text>
        <Text
          style={styles.nameLast}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.45}
        >
          {last}
        </Text>
      </View>

      {/* ── 12. RULE ────────────────────────────────────────────────── */}
      <View style={[styles.rule, { bottom: FOOTER_H }]} />

      {/* ── 13. STATS FOOTER ────────────────────────────────────────── */}
      <View style={[styles.footer, { height: FOOTER_H }]}>
        {stats.map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <View style={styles.footerDivider} />}
            <View style={styles.footerCol}>
              <Text style={styles.footerNum}>{s.value}</Text>
              <Text style={styles.footerLabel}>{s.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* ── 14. CORNER VIGNETTE ─────────────────────────────────────── */}
      <Svg
        style={StyleSheet.absoluteFillObject}
        width={W} height={H}
        pointerEvents="none"
      >
        <Polygon points={`0,0 ${W*0.44},0 0,${H*0.34}`}                     fill="rgba(0,0,0,0.08)" />
        <Polygon points={`${W},0 ${W*0.56},0 ${W},${H*0.34}`}               fill="rgba(0,0,0,0.06)" />
        <Polygon points={`0,${H} ${W*0.44},${H} 0,${H*0.76}`}               fill="rgba(0,0,0,0.08)" />
        <Polygon points={`${W},${H} ${W*0.56},${H} ${W},${H*0.76}`}         fill="rgba(0,0,0,0.06)" />
      </Svg>

    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    width:           CARD_WIDTH,
    height:          CARD_HEIGHT,
    borderRadius:    28,
    overflow:        'hidden',
    backgroundColor: NAVY,
    borderWidth:     3,
    borderColor:     '#143B73',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 14 },
    shadowOpacity:   0.55,
    shadowRadius:    22,
    elevation:       20,
  },

  // Stadium background
  stadiumBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
    height:  CARD_HEIGHT * 0.72,
  },

  // Vertical "FRONT ROW FAN"
  vertText: {
    position:    'absolute',
    fontFamily:  FONTS.audiowide,
    fontSize:    8,
    letterSpacing: 5,
    color:       '#183E73',
    opacity:     0.62,
    textAlign:   'center',
    transform:   [{ rotate: '-90deg' }],
  },

  // Left stars
  leftStars: {
    position:   'absolute',
    left:       18,
    alignItems: 'center',
    gap:        8,
  },
  leftStar: {
    fontSize: 9,
    color:    V_RED,
    opacity:  0.80,
  },

  // Rookie ribbon
  ribbonRow: {
    position:      'absolute',
    left:          0,
    flexDirection: 'row',
    alignItems:    'center',
    zIndex:        10,
  },
  ribbonBody: {
    paddingHorizontal: 14,
    paddingLeft:       18,
    justifyContent:    'center',
    alignItems:        'center',
  },
  ribbonText: {
    fontFamily:    FONTS.audiowide,
    fontSize:      12,
    color:         '#FFFFFF',
    letterSpacing: 5,
  },
  ribbonArrow: {
    borderTopColor:    'transparent',
    borderBottomColor: 'transparent',
    borderStyle:       'solid',
  },

  // Number badge
  badgeWrapper: {
    position:   'absolute',
    top:        0,
    right:      18,
    alignItems: 'center',
    zIndex:     10,
  },
  badgeBody: {
    width:         '100%',
    paddingTop:    10,
    paddingBottom: 8,
    alignItems:    'center',
  },
  badgeText: {
    fontFamily:  FONTS.tourney,
    fontSize:    38,
    color:       '#FFFFFF',
    lineHeight:  40,
  },
  badgeArrow: {
    borderLeftColor:  'transparent',
    borderRightColor: 'transparent',
    borderStyle:      'solid',
  },

  // Avatar rings
  avatarOuter: {
    position:        'absolute',
    borderWidth:     5,
    borderColor:     '#E8E1D4',
    backgroundColor: '#173765',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 5 },
    shadowOpacity:   0.40,
    shadowRadius:    12,
    elevation:       10,
  },
  avatarRing: {
    borderWidth:     3,
    borderColor:     '#0E2A55',
    backgroundColor: '#102B56',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarFill: {
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#102B56',
  },
  avatarPlaceholder: {
    width:           '100%',
    height:          '100%',
    backgroundColor: '#102B56',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarQ: {
    fontFamily: FONTS.bold,
    fontSize:   72,
    color:      'rgba(130,165,220,0.45)',
  },

  // Drop photo label
  dropRow: {
    position:       'absolute',
    left:           0,
    right:          0,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
  },
  dropStars: {
    fontSize: 10,
    color:    V_RED,
    opacity:  0.80,
  },
  dropBadge: {
    backgroundColor:  NAVY,
    paddingHorizontal: 12,
    paddingVertical:   4,
  },
  dropText: {
    fontFamily:    FONTS.audiowide,
    fontSize:      9,
    color:         '#FFFFFF',
    letterSpacing: 2,
  },

  // Name block
  nameBlock: {
    position:          'absolute',
    left:              14,
    right:             14,
    justifyContent:    'center',
  },
  nameFirst: {
    fontFamily:       FONTS.tourney,
    fontSize:         78,
    lineHeight:       66,
    color:            NAVY,
    letterSpacing:    1,
    textShadowColor:  'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  nameLast: {
    fontFamily:       FONTS.tourney,
    fontSize:         78,
    lineHeight:       66,
    color:            V_RED,
    letterSpacing:    1,
    textShadowColor:  'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },

  // Rule
  rule: {
    position:         'absolute',
    left:             14,
    right:            14,
    height:           StyleSheet.hairlineWidth,
    backgroundColor:  '#C4BAB0',
  },

  // Stats footer
  footer: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    backgroundColor:   NAVY,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 4,
  },
  footerDivider: {
    width:           1,
    height:          38,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  footerCol: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  footerNum: {
    fontFamily:  FONTS.tourney,
    fontSize:    34,
    color:       '#FFFFFF',
    lineHeight:  36,
  },
  footerLabel: {
    fontFamily:    FONTS.bold,
    fontSize:      9,
    color:         'rgba(255,255,255,0.60)',
    letterSpacing: 3,
  },
});
