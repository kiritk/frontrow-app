import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { getLocalEvents, LocalEvent } from '../lib/localStorage';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';
import FanCard from '../components/FanCard';

const PROFILE_STORAGE_KEY = 'frontrow_user_profile';

export default function StatsScreen() {
  const navigation = useNavigation<any>();
  const { user, localEventsVersion } = useAuth();
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const profile = JSON.parse(stored);
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setProfileImage(profile.profileImage || null);
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const all = await getLocalEvents();
      setEvents(all);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    fetchEvents();
  }, [user, localEventsVersion, loadProfile, fetchEvents]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
      fetchEvents();
    });
    return unsubscribe;
  }, [navigation, loadProfile, fetchEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), fetchEvents()]);
    setRefreshing(false);
  };

  const eventCount = events.length;
  const cityCount = new Set(events.map(e => e.venue_location || e.venue).filter(Boolean)).size;
  const venueCount = new Set(events.map(e => e.venue).filter(Boolean)).size;
  const sportsCount = events.filter(e => e.type === 'sports').length;

  const getFanLevel = () => {
    if (eventCount >= 50) {
      return { level: 'Legend', color: '#F59E0B', nextLevel: null, eventsToNext: 0, progress: 1 };
    } else if (eventCount >= 25) {
      return { level: 'All-Star', color: '#22C55E', nextLevel: 'Legend', eventsToNext: 50 - eventCount, progress: (eventCount - 25) / 25 };
    } else if (eventCount >= 10) {
      return { level: 'Pro', color: '#DC2626', nextLevel: 'All-Star', eventsToNext: 25 - eventCount, progress: (eventCount - 10) / 15 };
    } else {
      return { level: 'Rookie', color: '#3B82F6', nextLevel: 'Pro', eventsToNext: 10 - eventCount, progress: eventCount / 10 };
    }
  };

  const fanLevel = getFanLevel();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />
        }
      >
        <Text style={styles.pageTitle}>Stats</Text>

        {/* Fan Card */}
        <View style={styles.fanCardContainer}>
          <FanCard
            firstName={firstName}
            lastName={lastName}
            profileImage={profileImage}
            fanLevel={fanLevel.level}
            eventCount={eventCount}
            cityCount={cityCount}
            venueCount={venueCount}
            sportsCount={sportsCount}
          />
          {!firstName && (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
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
              <View style={[styles.progressFill, { width: `${Math.min((eventCount / 50) * 100, 100)}%` }]} />
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
  pageTitle: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: 32,
    color: COLORS.navy,
    marginBottom: SPACING.lg,
  },
  fanCardContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  editProfileButton: {
    marginTop: SPACING.md,
    paddingVertical: 10,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.navy,
  },
  editProfileButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
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
  eventCountContainer: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.creamDark,
  },
  eventCountNumber: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: COLORS.navy,
  },
  eventCountLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
});
