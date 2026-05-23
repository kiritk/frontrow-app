import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Image, ImageBackground, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getLocalEvents } from '../lib/localStorage';
import { computeExtendedStats, getFanLevel } from '../lib/stats';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';
import AppHeader from '../components/AppHeader';
import EventTypePie from '../components/EventTypePie';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = SPACING.lg;

// ── Background images ────────────────────────────────────────────────────────
const PROFILE_BG      = require('../../assets/images/profile_bg.jpg');
const OTHER_SPORTS_BG = require('../../assets/images/other_sports_bg.jpg');
const CONCERT_BG  = require('../../assets/images/concert_bg.png');
const THEATER_BG  = require('../../assets/images/theater_bg.jpg');
const COMEDY_BG   = require('../../assets/images/comedy_bg.jpg');
const LANDMARK_BG = require('../../assets/images/landmark_bg.jpg');
const BASKET_BG   = require('../../assets/images/basketball_bg.jpg');
const SOCCER_BG   = require('../../assets/images/soccer_bg.jpg');
const TENNIS_BG   = require('../../assets/images/tennis_bg.jpg');
const OTHER_BG    = require('../../assets/images/other_bg.jpg');

function getTypeBg(type: string, sport?: string) {
  if (type === 'concert')  return CONCERT_BG;
  if (type === 'theater')  return THEATER_BG;
  if (type === 'comedy')   return COMEDY_BG;
  if (type === 'landmark') return LANDMARK_BG;
  if (type === 'sports') {
    if (sport === 'nba')    return BASKET_BG;
    if (sport === 'soccer') return SOCCER_BG;
    if (sport === 'tennis') return TENNIS_BG;
    return PROFILE_BG;
  }
  return OTHER_BG;
}

// ── City/state extractor (drops country if present) ──────────────────────────
function cityState(location: string): string {
  const parts = location.split(',').map(s => s.trim()).filter(Boolean);
  return parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : parts[0] ?? location;
}

// ── Date formatter ───────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── Card shell helpers ───────────────────────────────────────────────────────
const DARK_GRAD: [string, string] = ['#0e1c2f', '#162440'];
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 12,
  elevation: 5,
};

export default function StatsScreen() {
  const navigation = useNavigation<any>();
  const { user, localEventsVersion } = useAuth();
  const [events, setEvents] = useState<Awaited<ReturnType<typeof getLocalEvents>>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try { setEvents(await getLocalEvents()); }
    catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchEvents(); }, [user, localEventsVersion, fetchEvents]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchEvents);
    return unsub;
  }, [navigation, fetchEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const stats    = useMemo(() => computeExtendedStats(events), [events]);
  const fanLevel = useMemo(() => getFanLevel(stats.eventCount), [stats.eventCount]);

  const {
    eventCount, cityCount, venueCount, yearCount,
    firstEvent, favoriteVenue, favoriteCity, eventsByType,
  } = stats;

  const hasEvents = eventCount > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Page header ─────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Stats</Text>
        </View>

        {/* ── 1. Fan Level ─────────────────────────────────────── */}
        <View style={[styles.fanLevelCard, CARD_SHADOW]}>
          <View style={styles.fanLevelHeader}>
            <View>
              <Text style={styles.fanLevelTitle}>Fan Level</Text>
              <Text style={styles.fanLevelSub}>
                {fanLevel.nextLevel
                  ? `${fanLevel.eventsToNext} more events to ${fanLevel.nextLevel}`
                  : 'You reached the highest level!'}
              </Text>
            </View>
            <View style={[styles.fanLevelBadge, { backgroundColor: fanLevel.color }]}>
              <Text style={styles.fanLevelBadgeText}>{fanLevel.level}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              width: `${Math.min((eventCount / 50) * 100, 100)}%` as any,
              backgroundColor: fanLevel.color,
            }]} />
          </View>
          <View style={styles.levelMarkers}>
            {[
              { label: 'Rookie',   color: '#3B82F6', min: 0  },
              { label: 'Pro',      color: '#DC2626', min: 10 },
              { label: 'All-Star', color: '#22C55E', min: 25 },
              { label: 'Legend',   color: '#F59E0B', min: 50 },
            ].map(m => (
              <View key={m.label} style={styles.levelMarker}>
                <View style={[styles.markerDot, { backgroundColor: m.color, opacity: eventCount >= m.min ? 1 : 0.28 }]} />
                <Text style={styles.markerLabel}>{m.label}</Text>
                <Text style={styles.markerRange}>{m.min === 50 ? '50+' : `${m.min}-${m.min === 25 ? 49 : m.min === 10 ? 24 : 9}`}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 2. Total Events hero ─────────────────────────────── */}
        <View style={[styles.heroCard, CARD_SHADOW]}>
          <ImageBackground
            source={OTHER_SPORTS_BG}
            style={StyleSheet.absoluteFillObject as any}
            imageStyle={{ opacity: 0.5 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(12,28,60,0.92)', 'rgba(18,44,94,0.80)']}
            style={StyleSheet.absoluteFillObject as any}
          />
          {/* Top: big number */}
          <View style={styles.heroTop}>
            <Text style={styles.heroNum}>{hasEvents ? eventCount : '—'}</Text>
            <Text style={styles.heroLabel}>EVENTS ATTENDED</Text>
          </View>
          {/* Bottom: sub-stats */}
          <View style={styles.heroDivider} />
          <View style={styles.heroRow}>
            {[
              { v: hasEvents ? cityCount  : '—', l: 'CITIES'  },
              { v: hasEvents ? venueCount : '—', l: 'VENUES'  },
              { v: hasEvents ? yearCount  : '—', l: 'YEARS'   },
            ].map((s, i, arr) => (
              <React.Fragment key={s.l}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatNum}>{s.v}</Text>
                  <Text style={styles.heroStatLabel}>{s.l}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.heroStatDiv} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── 3. Events by Type ────────────────────────────────── */}
        <View style={[styles.pieCard, CARD_SHADOW]}>
          <Text style={styles.pieCardTitle}>Events by Type</Text>
          {eventsByType.length > 0 ? (
            <EventTypePie slices={eventsByType} />
          ) : (
            <Text style={styles.emptyHintDark}>Add events to see your breakdown</Text>
          )}
        </View>

        {/* ── 4. First Event ───────────────────────────────────── */}
        <View style={[styles.darkCard, CARD_SHADOW]}>
          {firstEvent && (
            <Image
              source={getTypeBg(firstEvent.type, firstEvent.sport)}
              style={StyleSheet.absoluteFillObject as any}
              resizeMode="cover"
            />
          )}
          <LinearGradient
            colors={['rgba(8,16,30,0.94)', 'rgba(14,28,54,0.86)']}
            style={StyleSheet.absoluteFillObject as any}
          />
          <View style={styles.darkCardContent}>
            <Text style={styles.goldLabel}>YOUR FIRST EXPERIENCE</Text>
            {firstEvent ? (
              <>
                <Text style={styles.firstEventTitle} numberOfLines={2}>{firstEvent.title}</Text>
                <Text style={styles.firstEventMeta}>
                  {fmtDate(firstEvent.date)}
                  {firstEvent.venue ? ` · ${firstEvent.venue}` : ''}
                </Text>
              </>
            ) : (
              <Text style={styles.emptyWhite}>No events yet</Text>
            )}
          </View>
        </View>

        {/* ── 5. Favorite Venue + City ─────────────────────────── */}
        <View style={styles.insightRow}>
          {/* Venue */}
          <View style={[styles.insightCard, CARD_SHADOW]}>
            <LinearGradient colors={DARK_GRAD} style={StyleSheet.absoluteFillObject as any} />
            <Ionicons name="location" size={18} color={COLORS.gold} style={{ marginBottom: 6 }} />
            <Text style={styles.insightLabel}>FAVORITE VENUE</Text>
            <Text style={styles.insightValue} numberOfLines={2}>
              {favoriteVenue?.name ?? '—'}
            </Text>
            {favoriteVenue && (
              <Text style={styles.insightCount}>{favoriteVenue.count} visit{favoriteVenue.count !== 1 ? 's' : ''}</Text>
            )}
          </View>

          {/* City */}
          <View style={[styles.insightCard, CARD_SHADOW]}>
            <LinearGradient colors={['#111e30', '#1a2e48']} style={StyleSheet.absoluteFillObject as any} />
            <Ionicons name="map" size={18} color={COLORS.gold} style={{ marginBottom: 6 }} />
            <Text style={styles.insightLabel}>FAVORITE CITY</Text>
            <Text style={styles.insightValue} numberOfLines={2}>
              {favoriteCity ? cityState(favoriteCity.name) : '—'}
            </Text>
            {favoriteCity && (
              <Text style={styles.insightCount}>{favoriteCity.count} visit{favoriteCity.count !== 1 ? 's' : ''}</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  content: {
    paddingHorizontal: H_PAD,
    paddingBottom: 110,
    gap: SPACING.md,
  },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  pageTitle: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.navy,
  },

  // ── Hero card ──────────────────────────────────────────────────────────────
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroTop: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  heroNum: {
    fontFamily: FONTS.bold,
    fontSize: 80,
    lineHeight: 80,
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  heroLabel: {
    fontFamily: FONTS.audiowide,
    fontSize: 10,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
  },
  heroDivider: {
    height: 1,
    marginHorizontal: SPACING.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatNum: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xxl,
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontFamily: FONTS.audiowide,
    fontSize: 8,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.50)',
    marginTop: 3,
  },
  heroStatDiv: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center',
  },

  // ── Fan Level card ─────────────────────────────────────────────────────────
  fanLevelCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  fanLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  fanLevelTitle: {
    fontFamily: FONTS.geistMonoBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.navy,
    marginBottom: 4,
  },
  fanLevelSub: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  fanLevelBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  fanLevelBadgeText: {
    fontFamily: FONTS.geistMonoBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.creamDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  levelMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelMarker: {
    alignItems: 'center',
    flex: 1,
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 5,
  },
  markerLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    color: COLORS.navy,
    marginBottom: 2,
  },
  markerRange: {
    fontFamily: FONTS.regular,
    fontSize: 9,
    color: COLORS.gray,
  },

  // ── Pie card (Events by Type) ──────────────────────────────────────────────
  pieCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pieCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  emptyHintDark: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },

  // ── Dark card (First Event) ────────────────────────────────────────────────
  darkCard: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  darkCardContent: {
    padding: SPACING.xl,
  },
  goldLabel: {
    fontFamily: FONTS.audiowide,
    fontSize: 9,
    letterSpacing: 3,
    color: COLORS.gold,
    marginBottom: SPACING.sm,
  },
  firstEventTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 26,
  },
  firstEventMeta: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.55)',
  },

  // ── Insight row (Venue + City) ─────────────────────────────────────────────
  insightRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  insightCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    padding: SPACING.lg,
    minHeight: 130,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  insightLabel: {
    fontFamily: FONTS.audiowide,
    fontSize: 8,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 6,
  },
  insightValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    lineHeight: 22,
    flex: 1,
  },
  insightCount: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.gold,
    marginTop: 6,
  },

  // ── Empty states ───────────────────────────────────────────────────────────
  emptyWhite: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.40)',
    marginTop: SPACING.xs,
  },
});
