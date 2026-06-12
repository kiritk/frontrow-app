import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getLocalEvents } from '../lib/localStorage';
import { computeExtendedStats, getFanLevel } from '../lib/stats';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';
import AppHeader from '../components/AppHeader';
import FanCard from '../components/FanCard';

const H_PAD = SPACING.lg;

// ── Card shell helpers ───────────────────────────────────────────────────────
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 12,
  elevation: 5,
};

export default function StatsScreen() {
  const navigation = useNavigation<any>();
  const { user, profile, localEventsVersion } = useAuth();
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

  const { eventCount, cityCount, venueCount, yearCount } = stats;

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

        {/* ── Fan Card ─────────────────────────────────────────── */}
        <View style={styles.fanCardWrapper}>
          <FanCard
            firstName={profile.firstName}
            lastName={profile.lastName}
            profileImage={profile.profileImage}
            fanLevel={fanLevel.level}
            eventCount={eventCount}
            cityCount={cityCount}
            venueCount={venueCount}
            yearCount={yearCount}
          />
        </View>

        {/* ── Fan Level ─────────────────────────────────────────── */}
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
    fontFamily: FONTS.geistMonoBold,
    fontSize: 34,
    color: COLORS.navy,
  },

  // ── Fan card wrapper ───────────────────────────────────────────────────────
  fanCardWrapper: {
    alignItems: 'center',
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
});
