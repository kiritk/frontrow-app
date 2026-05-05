import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, FlatList,
  RefreshControl, ScrollView, Dimensions, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchEvents as fetchEventsFromService, removeEvent } from '../lib/eventService';
import EventCard, { STACKED_CARD_HEIGHT, PEEK_HEIGHT, EventData } from '../components/EventCard';
import EventDetailView from '../components/EventDetailView';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

const PROFILE_STORAGE_KEY = 'frontrow_user_profile';

interface Event {
  id: string;
  title: string;
  type: string;
  sport?: string;
  venue: string;
  venue_location?: string;
  date: string;
  photos?: string[];
  cover_photo?: string;
  latitude?: number;
  longitude?: number;
  home_team?: { name: string; city: string; fullName: string };
  away_team?: { name: string; city: string; fullName: string };
}

const CATEGORIES = [
  { value: 'all',      label: 'All',       icon: null },
  { value: 'sports',   label: 'Sports',    icon: 'trophy-outline' as const },
  { value: 'concert',  label: 'Concerts',  icon: 'musical-notes-outline' as const },
  { value: 'theater',  label: 'Theater',   icon: 'drama-masks' as const },
  { value: 'comedy',   label: 'Comedy',    icon: 'mic-outline' as const },
  { value: 'landmark', label: 'Landmarks', icon: 'location-outline' as const },
  { value: 'other',    label: 'Other',     icon: 'ellipsis-horizontal-outline' as const },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDE_PADDING = SCREEN_WIDTH * 0.05;
const LIST_BOTTOM_PADDING = 110;

export default function EventsScreen({ refreshKey }: { refreshKey?: number }) {
  const { user, localEventsVersion } = useAuth();
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const listAnim = useRef(new Animated.Value(1)).current;
  const detailAnim = useRef(new Animated.Value(0)).current;

  const loadProfileImage = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const profile = JSON.parse(stored);
        setProfileImage(profile.profileImage || null);
      }
    } catch (error) {
      console.log('Error loading profile image:', error);
    }
  }, []);

  useEffect(() => {
    loadProfileImage();
    const unsubscribe = navigation.addListener('focus', loadProfileImage);
    return unsubscribe;
  }, [navigation, loadProfileImage]);

  const fetchEvents = useCallback(async () => {
    try {
      const allEvents = await fetchEventsFromService(user?.id);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshKey, localEventsVersion]);

  const yearTabs = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => set.add(new Date(e.date).getFullYear().toString()));
    const years = Array.from(set).sort((a, b) => Number(b) - Number(a));
    return ['Upcoming', 'All', ...years];
  }, [events]);

  const yearFilteredEvents = useMemo(() => {
    if (selectedYear === 'All') return events;
    if (selectedYear === 'Upcoming') return events.filter(e => new Date(e.date) >= new Date());
    return events.filter(e => new Date(e.date).getFullYear().toString() === selectedYear);
  }, [events, selectedYear]);

  const visibleCategories = useMemo(() => {
    if (yearFilteredEvents.length === 0) return [CATEGORIES[0]];
    const eventTypes = new Set(yearFilteredEvents.map(e => e.type));
    return CATEGORIES.filter(cat => cat.value === 'all' || eventTypes.has(cat.value));
  }, [yearFilteredEvents]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !visibleCategories.some(c => c.value === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [visibleCategories, selectedCategory]);

  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return yearFilteredEvents;
    return yearFilteredEvents.filter(e => e.type === selectedCategory);
  }, [yearFilteredEvents, selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await removeEvent(eventId, user?.id);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const openDetail = useCallback((event: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEvent(event);
    setDetailVisible(true);
    detailAnim.setValue(0);
    Animated.parallel([
      Animated.timing(listAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(detailAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [listAnim, detailAnim]);

  const closeDetail = useCallback(() => {
    Animated.parallel([
      Animated.timing(detailAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(listAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDetailVisible(false);
      setSelectedEvent(null);
      fetchEvents();
    });
  }, [detailAnim, listAnim, fetchEvents]);

  const renderEventCard = useCallback(
    ({ item, index }: { item: Event; index: number }) => {
      const total = filteredEvents.length;
      const indexFromFront = total - 1 - index; // 0 = front/top card
      const isFront = indexFromFront === 0;

      // Wallet stack: scale down cards further behind the front (no opacity — preserves bold colors)
      const cardScale = Math.max(0.92, 1 - indexFromFront * 0.02);
      const cardTranslateY = indexFromFront * 12;

      return (
        <View
          style={{
            zIndex: index + 1,
            marginTop: index === 0 ? 0 : -(STACKED_CARD_HEIGHT - PEEK_HEIGHT),
            alignItems: 'center',
            transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
          }}
        >
          <EventCard event={item} onPress={() => openDetail(item)} isFront={isFront} />
        </View>
      );
    },
    [openDetail, filteredEvents.length],
  );

  const ListHeader = (
    <>
      {/* Year tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.yearTabsContent}
        style={styles.yearTabsScroll}
      >
        {yearTabs.map(year => {
          const active = selectedYear === year;
          return (
            <TouchableOpacity
              key={year}
              onPress={() => setSelectedYear(year)}
              style={styles.yearTab}
              activeOpacity={0.7}
            >
              <Text style={[styles.yearTabText, active && styles.yearTabTextActive]}>
                {year}
              </Text>
              {active && <View style={styles.yearTabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.yearTabDivider} />

      {/* Category pills */}
      {visibleCategories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsContent}
          style={styles.categoryPillsScroll}
        >
          {visibleCategories.map(cat => {
            const active = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setSelectedCategory(cat.value)}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
                activeOpacity={0.7}
              >
                {cat.icon && (
                  cat.value === 'theater' ? (
                    <MaterialCommunityIcons
                      name="drama-masks"
                      size={14}
                      color={active ? COLORS.navy : COLORS.gray}
                      style={styles.categoryPillIcon}
                    />
                  ) : (
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={active ? COLORS.navy : COLORS.gray}
                      style={styles.categoryPillIcon}
                    />
                  )
                )}
                <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </>
  );

  return (
    <View style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View
        style={{
          flex: 1,
          opacity: listAnim,
          transform: [{
            translateY: listAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }}
        pointerEvents={detailVisible ? 'none' : 'auto'}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => (navigation as any).navigate('Profile')}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileButtonImage} />
          ) : (
            <View style={styles.profileButtonPlaceholder}>
              <Ionicons name="person" size={18} color={COLORS.navy} />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.logoPill}>
          <Text style={styles.logoText}>Front Row</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.pageTitle}>Events</Text>

      {/* Stacked event cards with filters in the list header */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎫</Text>
            <Text style={styles.emptyText}>No events yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first event</Text>
          </View>
        }
      />
      </Animated.View>
    </SafeAreaView>
    {detailVisible && selectedEvent && (
      <EventDetailView
        event={selectedEvent}
        onClose={closeDetail}
        onDelete={() => handleDeleteEvent(selectedEvent.id)}
        onUpdate={fetchEvents}
        animValue={detailAnim}
      />
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIDE_PADDING,
    paddingVertical: SPACING.sm,
  },
  profileButton: {
    width: 38,
    height: 38,
  },
  profileButtonImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: COLORS.navy,
  },
  profileButtonPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.creamDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.creamDark,
  },
  logoText: {
    fontFamily: FONTS.vt323,
    fontSize: 26,
    color: COLORS.navy,
  },
  headerSpacer: {
    width: 38,
  },
  pageTitle: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.navy,
    paddingHorizontal: SIDE_PADDING,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  // Year tabs
  yearTabsScroll: {
    flexGrow: 0,
  },
  yearTabsContent: {
    paddingHorizontal: SIDE_PADDING,
    gap: SPACING.lg,
  },
  yearTab: {
    paddingBottom: SPACING.sm,
    position: 'relative',
  },
  yearTabText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
  yearTabTextActive: {
    fontFamily: FONTS.semiBold,
    color: COLORS.navy,
  },
  yearTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.navy,
    borderRadius: 1,
  },
  yearTabDivider: {
    marginBottom: SPACING.md,
  },
  // Category pills
  categoryPillsScroll: {
    flexGrow: 0,
    marginBottom: SPACING.lg,
  },
  categoryPillsContent: {
    paddingHorizontal: SIDE_PADDING,
    gap: SPACING.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryPillActive: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.navy,
  },
  categoryPillIcon: {
    marginRight: 5,
  },
  categoryPillText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  categoryPillTextActive: {
    color: COLORS.navy,
    fontFamily: FONTS.semiBold,
  },
  // List
  listContent: {
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: SIDE_PADDING,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
