import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchEvents as fetchEventsFromService, removeEvent } from '../lib/eventService';
import EventCard from '../components/EventCard';
import FilterDropdown, { DropdownOption } from '../components/FilterDropdown';
import { continentForEvent, Continent } from '../lib/continents';
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

const CATEGORIES: DropdownOption[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'sports', label: 'Sports', icon: 'trophy-outline' },
  { value: 'concert', label: 'Concerts', icon: 'musical-notes-outline' },
  { value: 'theater', label: 'Theater', icon: 'ticket-outline' },
  { value: 'comedy', label: 'Comedy', icon: 'mic-outline' },
  { value: 'landmark', label: 'Landmarks', icon: 'location-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const CONTINENT_ORDER: Continent[] = [
  'North America',
  'South America',
  'Europe',
  'Africa',
  'Asia',
  'Oceania',
  'Antarctica',
];

const LIST_BOTTOM_PADDING = 110;

export default function EventsScreen({ refreshKey }: { refreshKey?: number }) {
  const { user, localEventsVersion } = useAuth();
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [profileImage, setProfileImage] = useState<string | null>(null);

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
    if (yearFilteredEvents.length === 0) return [CATEGORIES[0]];
    const eventTypes = new Set(yearFilteredEvents.map(e => e.type));
    return CATEGORIES.filter(cat => cat.value === 'all' || eventTypes.has(cat.value));
  }, [yearFilteredEvents]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !visibleCategories.some(c => c.value === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [visibleCategories, selectedCategory]);

  const categoryFilteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return yearFilteredEvents;
    return yearFilteredEvents.filter(e => e.type === selectedCategory);
  }, [yearFilteredEvents, selectedCategory]);

  const continentOptions = useMemo<DropdownOption[]>(() => {
    const present = new Set<Continent>();
    categoryFilteredEvents.forEach(e => {
      const c = continentForEvent(e);
      if (c) present.add(c);
    });
    const opts: DropdownOption[] = [{ value: 'all', label: 'All' }];
    CONTINENT_ORDER.forEach(c => {
      if (present.has(c)) opts.push({ value: c, label: c });
    });
    return opts;
  }, [categoryFilteredEvents]);

  useEffect(() => {
    if (selectedContinent !== 'all' && !continentOptions.some(o => o.value === selectedContinent)) {
      setSelectedContinent('all');
    }
  }, [continentOptions, selectedContinent]);

  const filteredEvents = useMemo(() => {
    if (selectedContinent === 'all') return categoryFilteredEvents;
    return categoryFilteredEvents.filter(e => continentForEvent(e) === selectedContinent);
  }, [categoryFilteredEvents, selectedContinent]);

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

  const yearOptions = useMemo<DropdownOption[]>(() => {
    const set = new Set<string>();
    events.forEach(e => set.add(new Date(e.date).getFullYear().toString()));
    const years = Array.from(set).sort((a, b) => Number(b) - Number(a));
    return [
      { value: 'All', label: 'All' },
      { value: 'Upcoming', label: 'Upcoming' },
      ...years.map(y => ({ value: y, label: y })),
    ];
  }, [events]);

  const renderEventCard = useCallback(
    ({ item }: { item: Event }) => (
      <EventCard event={item} onDelete={() => handleDeleteEvent(item.id)} onUpdate={fetchEvents} />
    ),
    [fetchEvents, events]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

      {/* Page title + filters */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Events</Text>
      </View>
      <View style={styles.dropdownRow}>
        <FilterDropdown
          label="Year"
          value={selectedYear}
          options={yearOptions}
          onSelect={setSelectedYear}
          defaultValue="All"
        />
        <FilterDropdown
          label="Category"
          value={selectedCategory}
          options={visibleCategories}
          onSelect={setSelectedCategory}
          defaultValue="all"
          showIconOnPill
        />
        <FilterDropdown
          label="Continent"
          value={selectedContinent}
          options={continentOptions}
          onSelect={setSelectedContinent}
          defaultValue="all"
        />
      </View>

      {/* Event grid */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={item => item.id}
        numColumns={3}
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
    </SafeAreaView>
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
  titleRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  pageTitle: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: 28,
    color: COLORS.navy,
  },
  dropdownRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  row: {
    justifyContent: 'flex-start',
    gap: 20,
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
