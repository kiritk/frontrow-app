import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useAuth } from '../context/AuthContext';
import { fetchEvents as fetchEventsFromService, removeEvent } from '../lib/eventService';
import EventCard from '../components/EventCard';
import EventsGlobe from '../components/EventsGlobe';
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
  { key: 'all', label: 'All', icon: null },
  { key: 'sports', label: 'Sports', icon: 'trophy-outline' },
  { key: 'concert', label: 'Concerts', icon: 'musical-notes-outline' },
  { key: 'theater', label: 'Theater', icon: 'ticket-outline' },
  { key: 'comedy', label: 'Comedy', icon: 'mic-outline' },
  { key: 'landmark', label: 'Landmarks', icon: 'location-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

// Space reserved at bottom of sheet so content doesn't hide behind tab bar / FAB
const TAB_BAR_INSET = 104;

export default function EventsScreen({ refreshKey }: { refreshKey?: number }) {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '45%', '85%'], []);

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
  }, [fetchEvents, refreshKey]);

  // Events filtered by year (used to determine which categories are visible)
  const yearFilteredEvents = useMemo(() => {
    let filtered = [...events];
    if (selectedYear !== 'All' && selectedYear !== 'Upcoming') {
      filtered = filtered.filter(e => new Date(e.date).getFullYear().toString() === selectedYear);
    } else if (selectedYear === 'Upcoming') {
      filtered = filtered.filter(e => new Date(e.date) >= new Date());
    }
    return filtered;
  }, [events, selectedYear]);

  const visibleCategories = useMemo(() => {
    if (yearFilteredEvents.length === 0) return [];
    const eventTypes = new Set(yearFilteredEvents.map(e => e.type));
    return CATEGORIES.filter(cat => cat.key === 'all' || eventTypes.has(cat.key));
  }, [yearFilteredEvents]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !visibleCategories.some(c => c.key === selectedCategory)) {
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
      setEvents(events.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const years = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => set.add(new Date(e.date).getFullYear().toString()));
    return ['Upcoming', 'All', ...Array.from(set).sort((a, b) => Number(b) - Number(a))];
  }, [events]);

  const renderEventCard = useCallback(
    ({ item }: { item: Event }) => (
      <EventCard event={item} onDelete={() => handleDeleteEvent(item.id)} onUpdate={fetchEvents} />
    ),
    [fetchEvents, events]
  );

  // Sticky filter header rendered inside the bottom sheet
  const renderSheetHeader = () => (
    <View style={styles.sheetHeader}>
      <Text style={styles.sheetTitle}>Events</Text>

      {/* Year tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.yearTabsContent}
        style={styles.yearTabsContainer}
      >
        {years.map(year => (
          <TouchableOpacity
            key={year}
            style={[styles.yearTab, selectedYear === year && styles.yearTabActive]}
            onPress={() => setSelectedYear(year)}
          >
            <Text style={[styles.yearTabText, selectedYear === year && styles.yearTabTextActive]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category pills */}
      {visibleCategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsContent}
          style={styles.categoryPillsContainer}
        >
          {visibleCategories.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryPill, selectedCategory === cat.key && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              {cat.icon && (
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={selectedCategory === cat.key ? COLORS.white : COLORS.navy}
                />
              )}
              <Text style={[styles.categoryPillText, selectedCategory === cat.key && styles.categoryPillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Globe fills the whole screen as a background layer */}
      <View style={StyleSheet.absoluteFill}>
        <EventsGlobe events={filteredEvents} />
      </View>

      {/* Header: profile avatar + logo, overlaid on the globe */}
      <SafeAreaView style={styles.headerSafeArea} edges={['top']} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
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
      </SafeAreaView>

      {/* Draggable bottom sheet with filter pills and events list */}
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        bottomInset={TAB_BAR_INSET}
        detached={false}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        {renderSheetHeader()}
        <BottomSheetFlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={filteredEvents.length > 0 ? styles.row : undefined}
          contentContainerStyle={styles.listContent}
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
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
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
    borderColor: COLORS.white,
  },
  profileButtonPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  logoPill: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  logoText: {
    fontFamily: FONTS.vt323,
    fontSize: 26,
    color: COLORS.navy,
  },
  headerSpacer: {
    width: 38,
  },
  sheetBackground: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHandle: {
    backgroundColor: COLORS.gray,
    width: 44,
    height: 5,
  },
  sheetHeader: {
    paddingTop: SPACING.xs,
    backgroundColor: COLORS.cream,
  },
  sheetTitle: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: 28,
    color: COLORS.navy,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
  },
  yearTabsContainer: {
    marginTop: SPACING.sm,
  },
  yearTabsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
    alignItems: 'center',
    height: 32,
  },
  yearTab: {
    justifyContent: 'center',
    height: 28,
  },
  yearTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.navy,
  },
  yearTabText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
  yearTabTextActive: {
    fontFamily: FONTS.semiBold,
    color: COLORS.navy,
  },
  categoryPillsContainer: {
    marginTop: SPACING.sm,
  },
  categoryPillsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'center',
    height: 44,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: 6,
    height: 36,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryPillActive: {
    backgroundColor: COLORS.navy,
  },
  categoryPillText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
  },
  categoryPillTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  row: {
    justifyContent: 'space-between',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: SPACING.lg,
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
