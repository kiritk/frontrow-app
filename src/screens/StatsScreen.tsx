import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getLocalEvents, LocalEvent } from '../lib/localStorage';
import { computeEventStats, getFanLevel } from '../lib/stats';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';
import TradingCardProfile from '../components/TradingCardProfile';
import AppHeader from '../components/AppHeader';

export default function StatsScreen() {
  const navigation = useNavigation<any>();
  const { user, localEventsVersion, profile } = useAuth();
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const all = await getLocalEvents();
      setEvents(all);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [user, localEventsVersion, fetchEvents]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchEvents);
    return unsubscribe;
  }, [navigation, fetchEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const stats = useMemo(() => computeEventStats(events), [events]);
  const fanLevel = useMemo(() => getFanLevel(stats.eventCount), [stats.eventCount]);
  const { eventCount, cityCount, venueCount, yearCount } = stats;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />
        }
      >
        {/* Header row */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Stats</Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="pencil" size={13} color={COLORS.navy} />
            <Text style={styles.editProfileButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Fan Card */}
        <View style={styles.fanCardContainer}>
          <TradingCardProfile
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

        {/* Fan Level Card */}
        <View style={styles.fanLevelCard}>
          <View style={styles.fanLevelHeader}>
            <View>
              <Text style={styles.fanLevelTitle}>Fan Level</Text>
              <Text style={styles.fanLevelSubtitle}>
                {fanLevel.nextLevel
                  ? `${fanLevel.eventsToNext} more events to ${fanLevel.nextLevel}`
                  : 'You reached the highest level!'}
              </Text>
            </View>
            <View style={[styles.fanLevelBadge, { backgroundColor: fanLevel.color }]}>
              <Text style={styles.fanLevelBadgeText}>{fanLevel.level}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min((eventCount / 50) * 100, 100)}%`, backgroundColor: fanLevel.color }]} />
            </View>
            <View style={styles.levelMarkers}>
              <View style={styles.levelMarker}>
                <View style={[styles.markerDot, { backgroundColor: '#3B82F6' }, eventCount >= 0 && styles.markerDotActive]} />
                <Text style={styles.markerLabel}>Rookie</Text>
                <Text style={styles.markerRange}>0-9</Text>
              </View>
              <View style={styles.levelMarker}>
                <View style={[styles.markerDot, { backgroundColor: '#DC2626' }, eventCount >= 10 && styles.markerDotActive]} />
                <Text style={styles.markerLabel}>Pro</Text>
                <Text style={styles.markerRange}>10-24</Text>
              </View>
              <View style={styles.levelMarker}>
                <View style={[styles.markerDot, { backgroundColor: '#22C55E' }, eventCount >= 25 && styles.markerDotActive]} />
                <Text style={styles.markerLabel}>All-Star</Text>
                <Text style={styles.markerRange}>25-49</Text>
              </View>
              <View style={styles.levelMarker}>
                <View style={[styles.markerDot, { backgroundColor: '#F59E0B' }, eventCount >= 50 && styles.markerDotActive]} />
                <Text style={styles.markerLabel}>Legend</Text>
                <Text style={styles.markerRange}>50+</Text>
              </View>
            </View>
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
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.navy,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.navy,
  },
  editProfileButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
  },
  fanCardContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  fanLevelCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fanLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  fanLevelTitle: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: FONT_SIZES.xl,
    color: COLORS.navy,
    marginBottom: 4,
  },
  fanLevelSubtitle: {
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
    fontFamily: 'GeistMono_700Bold',
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  progressContainer: {
    marginBottom: SPACING.lg,
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
    backgroundColor: COLORS.navy,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
    opacity: 0.3,
  },
  markerDotActive: {
    opacity: 1,
  },
  markerLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.navy,
    marginBottom: 2,
  },
  markerRange: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.gray,
  },
});
