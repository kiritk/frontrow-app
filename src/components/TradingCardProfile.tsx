import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { FONTS } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH  = Math.round(SCREEN_WIDTH * 0.88);
const CARD_HEIGHT = Math.round(CARD_WIDTH / 0.72);

const FOOTER_H  = Math.round(CARD_HEIGHT * 0.175);
const AVATAR_SZ = Math.round(CARD_WIDTH  * 0.26);

const NAVY  = '#0D2A52';
const V_RED = '#B53A3A';

const W = CARD_WIDTH;
const H = CARD_HEIGHT;

const CARD_BG = require('../../assets/images/card-background.png');

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

      {/* ── 1. BACKGROUND IMAGE ─────────────────────────────────────── */}
      <Image
        source={CARD_BG}
        style={{ position: 'absolute', top: 0, left: 0, width: CARD_WIDTH, height: CARD_HEIGHT }}
        resizeMode="stretch"
      />

      {/* ── 2. LEVEL TEXT — over top-left blue ribbon ───────────────── */}
      <View
        style={[styles.ribbonTextWrapper, {
          top:    Math.round(H * 0.065),
          height: RIBBON_H,
        }]}
        pointerEvents="none"
      >
        <Text style={styles.ribbonText}>{level.toUpperCase()}</Text>
      </View>

      {/* ── 3. EVENT COUNT — over top-right red badge ───────────────── */}
      <View
        style={[styles.badgeTextWrapper, { width: BADGE_W }]}
        pointerEvents="none"
      >
        <Text style={styles.badgeText}>#{eventCount}</Text>
      </View>

      {/* ── 4. AVATAR CIRCLE ────────────────────────────────────────── */}
      <View style={[styles.avatarOuter, {
        width:        AVATAR_SZ + 18,
        height:       AVATAR_SZ + 18,
        borderRadius: (AVATAR_SZ + 18) / 2,
        top:          avatarTop,
        left:         avatarLeft,
      }]}>
        <View style={[styles.avatarRing, {
          width:        AVATAR_SZ + 6,
          height:       AVATAR_SZ + 6,
          borderRadius: (AVATAR_SZ + 6) / 2,
        }]}>
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

      {/* ── 5. DROP PHOTO LABEL ─────────────────────────────────────── */}
      {!profileImage && (
        <View style={[styles.dropRow, { top: avatarTop + AVATAR_SZ + 22 }]}>
          <Text style={styles.dropStars}>★ ★ ★</Text>
          <View style={styles.dropBadge}>
            <Text style={styles.dropText}>DROP PHOTO HERE</Text>
          </View>
          <Text style={styles.dropStars}>★ ★ ★</Text>
        </View>
      )}

      {/* ── 6. NAME BLOCK ───────────────────────────────────────────── */}
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

      {/* ── 7. STATS FOOTER ─────────────────────────────────────────── */}
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

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width:           CARD_WIDTH,
    height:          CARD_HEIGHT,
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

  // Level label — transparent bg, sits over the blue ribbon in the image
  ribbonTextWrapper: {
    position:       'absolute',
    left:           0,
    paddingLeft:    18,
    justifyContent: 'center',
    zIndex:         10,
  },
  ribbonText: {
    fontFamily:    FONTS.audiowide,
    fontSize:      12,
    color:         '#FFFFFF',
    letterSpacing: 5,
  },

  // Event count — transparent bg, sits over the red badge in the image
  badgeTextWrapper: {
    position:      'absolute',
    top:           10,
    right:         18,
    alignItems:    'center',
    justifyContent: 'center',
    zIndex:        10,
  },
  badgeText: {
    fontFamily: FONTS.tourney,
    fontSize:   38,
    color:      '#FFFFFF',
    lineHeight: 40,
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
    backgroundColor:   NAVY,
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
    position:       'absolute',
    left:           14,
    right:          14,
    justifyContent: 'center',
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
    fontFamily: FONTS.tourney,
    fontSize:   34,
    color:      '#FFFFFF',
    lineHeight: 36,
  },
  footerLabel: {
    fontFamily:    FONTS.bold,
    fontSize:      9,
    color:         'rgba(255,255,255,0.60)',
    letterSpacing: 3,
  },
});
