import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  RefreshControl, ScrollView, Dimensions, Animated, Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchEvents as fetchEventsFromService, removeEvent } from '../lib/eventService';
import EventCard, { STACKED_CARD_HEIGHT, PEEK_HEIGHT } from '../components/EventCard';
import EventDetailView from '../components/EventDetailView';
import AppHeader from '../components/AppHeader';
import * as Haptics from 'expo-haptics';
import { LocalEvent } from '../lib/localStorage';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../theme/colors';
import { TAB_BAR_HEIGHT, TAB_BAR_BOTTOM_OFFSET } from '../theme/layout';
import { parseEventDate } from '../lib/dates';

type Event = LocalEvent;

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
// Extra breathing room above the floating tab-bar pill. Combined at runtime
// with the device's bottom safe-area inset and the tab-bar dimensions so the
// last card always clears the pill, regardless of device or pill changes.
const LIST_BOTTOM_CLEARANCE = 48;

export default function EventsScreen({ refreshKey }: { refreshKey?: number }) {
  const { user, localEventsVersion } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const listBottomPadding =
    insets.bottom + TAB_BAR_BOTTOM_OFFSET + TAB_BAR_HEIGHT + LIST_BOTTOM_CLEARANCE;
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const listAnim = useRef(new Animated.Value(1)).current;
  const detailAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const pendingScrollToEnd = useRef(true);
  const filteredEventsRef = useRef<Event[]>([]);

  // scrollToEnd lets the native scroll view compute the offset from its own
  // current viewport and content sizes, so a stale JS-side layout height can't
  // produce a wrong offset (the cold-start race we used to hit). The last
  // card's bottom lands listBottomPadding above the visible bottom.
  const scrollToLastCard = useCallback(() => {
    if (filteredEventsRef.current.length === 0) return;
    flatListRef.current?.scrollToEnd({ animated: false });
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const allEvents = await fetchEventsFromService(user?.id);
      setEvents(allEvents);
      // Keep the open detail view in sync with the freshly-loaded data.
      setSelectedEvent(prev => (prev ? allEvents.find(e => e.id === prev.id) ?? prev : null));
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshKey, localEventsVersion]);

  const yearTabs = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => set.add(parseEventDate(e.date).getFullYear().toString()));
    const years = Array.from(set).sort((a, b) => Number(b) - Number(a));
    return ['Upcoming', 'All', ...years];
  }, [events]);

  const yearFilteredEvents = useMemo(() => {
    if (selectedYear === 'All') return events;
    if (selectedYear === 'Upcoming') return events.filter(e => parseEventDate(e.date) >= new Date());
    return events.filter(e => parseEventDate(e.date).getFullYear().toString() === selectedYear);
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
    const base = selectedCategory === 'all'
      ? yearFilteredEvents
      : yearFilteredEvents.filter(e => e.type === selectedCategory);
    return [...base].sort((a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime());
  }, [yearFilteredEvents, selectedCategory]);

  // Keep ref in sync so the focus listener always sees the latest list
  filteredEventsRef.current = filteredEvents;

  // Re-arm the pending flag whenever the list empties, so the next batch of
  // data triggers a scroll-to-end via onLayout / onContentSizeChange.
  useEffect(() => {
    if (filteredEvents.length === 0) pendingScrollToEnd.current = true;
  }, [filteredEvents]);

  // Belt-and-suspenders: whenever the list contents change (cold start, year /
  // category filter swap), schedule a scroll-to-end on the next frame. The
  // onLayout / onContentSizeChange triggers below cover most cases, but if the
  // FlatList already had the same content size on mount neither fires, leaving
  // the user at the top of the list.
  useEffect(() => {
    if (filteredEvents.length === 0 || !pendingScrollToEnd.current) return;
    const raf = requestAnimationFrame(() => scrollToLastCard());
    return () => cancelAnimationFrame(raf);
  }, [filteredEvents, scrollToLastCard]);

  // Mark scroll pending on every screen focus (app open + tab tap). Pending
  // stays true until the user scrolls (onScrollBeginDrag), so any layout or
  // content-size events that arrive after focus also keep the list pinned to
  // the last card.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      pendingScrollToEnd.current = true;
      scrollToLastCard();
    });
    return unsubscribe;
  }, [navigation, scrollToLastCard]);

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

  // Tapping the Events tab (even while already on it) resets to the
  // starting state: close the detail view and scroll back to the front card.
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      if (detailVisible) {
        closeDetail();
      }
      pendingScrollToEnd.current = true;
      scrollToLastCard();
    });
    return unsubscribe;
  }, [navigation, scrollToLastCard, detailVisible, closeDetail]);

  const renderEventCard = useCallback(
    ({ item, index }: { item: Event; index: number }) => {
      const total = filteredEvents.length;
      const indexFromFront = total - 1 - index; // 0 = front/top card
      const isFront = indexFromFront === 0;

      // Wallet stack: scale down cards further behind the front (no opacity — preserves bold colors)
      const cardScale = Math.max(0.95, 1 - indexFromFront * 0.01);

      return (
        <View
          style={{
            zIndex: index + 1,
            marginTop: index === 0 ? 0 : -(STACKED_CARD_HEIGHT - PEEK_HEIGHT),
            alignItems: 'center',
            transform: [{ scale: cardScale }],
          }}
        >
          <EventCard event={item} onPress={() => openDetail(item)} isFront={isFront} />
        </View>
      );
    },
    [openDetail, filteredEvents.length],
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
      <AppHeader />

      <Text style={styles.pageTitle}>Events</Text>

      {/* Year tabs — fixed above the scrolling card list */}
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

      {/* Category pills — fixed above the scrolling card list */}
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
                      color={active ? COLORS.white : COLORS.gray}
                      style={styles.categoryPillIcon}
                    />
                  ) : (
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={active ? COLORS.white : COLORS.gray}
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

      {/* Stacked event cards */}
      <FlatList
        ref={flatListRef}
        style={{ flex: 1 }}
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={item => item.id}
        // Real footer (not contentContainerStyle paddingBottom) so its height is
        // included in scrollToEnd's content-size calculation and the front card
        // reliably clears the floating tab-bar pill on cold start.
        ListFooterComponent={<View style={{ height: listBottomPadding }} />}
        // Both onLayout (FlatList container resized — e.g. when category pills
        // appear) and onContentSizeChange (items rendered) can fire in either
        // order on cold start. Triggering from both, and only clearing the
        // pending flag on user interaction, makes the final scroll position
        // correct regardless of which event lands last.
        onLayout={() => {
          if (pendingScrollToEnd.current && filteredEventsRef.current.length > 0) {
            scrollToLastCard();
          }
        }}
        onContentSizeChange={() => {
          if (pendingScrollToEnd.current && filteredEventsRef.current.length > 0) {
            scrollToLastCard();
          }
        }}
        onScrollBeginDrag={() => { pendingScrollToEnd.current = false; }}
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
  pageTitle: {
    fontFamily: FONTS.geistMonoBold,
    fontSize: 34,
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
    flexShrink: 0,
    marginBottom: 8,
  },
  categoryPillsContent: {
    paddingHorizontal: SIDE_PADDING,
    paddingVertical: 4,
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
    backgroundColor: COLORS.navy,
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
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
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
