import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getLocalEvents, deleteLocalEvent } from '../lib/localStorage';
import EventCard from '../components/EventCard';
import EventsMap from '../components/EventsMap';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

interface Event {
  id: string;
  title: string;
  type: string;
  sport?: string;
  venue: string;
  venue_location?: string;
  date: string;
  photos?: string[];
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

export default function EventsScreen() {
  const { user, isGuest } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchEvents = useCallback(async () => {
    try {
      if (isGuest) {
        // Load from local storage
        const localEvents = await getLocalEvents();
        setEvents(localEvents);
      } else if (user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [user, isGuest]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Events filtered by year only (used for determining visible categories)
  const yearFilteredEvents = React.useMemo(() => {
    let filtered = [...events];
    if (selectedYear !== 'All' && selectedYear !== 'Upcoming') {
      filtered = filtered.filter(e => new Date(e.date).getFullYear().toString() === selectedYear);
    } else if (selectedYear === 'Upcoming') {
      filtered = filtered.filter(e => new Date(e.date) >= new Date());
    }
    return filtered;
  }, [events, selectedYear]);

  // Categories that have at least one event in the current year filter
  const visibleCategories = React.useMemo(() => {
    if (yearFilteredEvents.length === 0) return [];
    const eventTypes = new Set(yearFilteredEvents.map(e => e.type));
    return CATEGORIES.filter(cat => cat.key === 'all' || eventTypes.has(cat.key));
  }, [yearFilteredEvents]);

  // Reset category selection when it becomes unavailable
  useEffect(() => {
    if (selectedCategory !== 'all' && !visibleCategories.some(c => c.key === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [visibleCategories, selectedCategory]);

  useEffect(() => {
    let filtered = yearFilteredEvents;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.type === selectedCategory);
    }

    setFilteredEvents(filtered);
  }, [yearFilteredEvents, selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      if (isGuest) {
        // Delete from local storage
        await deleteLocalEvent(eventId);
      } else {
        // Delete from Supabase
        const { error } = await supabase.from('events').delete().eq('id', eventId);
        if (error) throw error;
      }
      setEvents(events.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Get unique years from events
  const getYears = () => {
    const years = new Set<string>();
    events.forEach(e => {
      years.add(new Date(e.date).getFullYear().toString());
    });
    return ['Upcoming', 'All', ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
  };

  const years = getYears();

  const renderEventCard = ({ item }: { item: Event }) => (
    <EventCard event={item} onDelete={() => handleDeleteEvent(item.id)} onUpdate={fetchEvents} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Front Row</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewToggleContainer}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewMode('list'); }}
          >
            <Ionicons
              name="list"
              size={18}
              color={viewMode === 'list' ? COLORS.white : COLORS.navy}
            />
            <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'map' && styles.viewToggleButtonActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewMode('map'); }}
          >
            <Ionicons 
              name="map-outline" 
              size={18} 
              color={viewMode === 'map' ? COLORS.white : COLORS.navy} 
            />
            <Text style={[styles.viewToggleText, viewMode === 'map' && styles.viewToggleTextActive]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
        <>
          {/* Title */}
          <Text style={styles.title}>Events</Text>

          {/* Year Tabs */}
          <View style={styles.yearTabsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.yearTabsContent}
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
          </View>

          {/* Category Pills */}
          {visibleCategories.length > 0 && (
            <View style={styles.categoryPillsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryPillsContent}
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
            </View>
          )}

          {/* Events Grid */}
          <FlatList
            data={filteredEvents}
            renderItem={renderEventCard}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
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
        </>
      ) : (
        <EventsMap events={filteredEvents} />
      )}
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
  logoText: {
    fontFamily: FONTS.vt323,
    fontSize: 28,
    color: COLORS.navy,
  },
  shareButton: {
    padding: SPACING.xs,
  },
  viewToggleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: COLORS.navy,
  },
  viewToggleText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
  },
  viewToggleTextActive: {
    color: COLORS.white,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: COLORS.navy,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  yearTabsContainer: {
    height: 36,
    marginTop: SPACING.sm,
  },
  yearTabsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
    alignItems: 'center',
    height: 36,
  },
  yearTab: {
    justifyContent: 'center',
    height: 32,
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
    height: 48,
    marginTop: SPACING.sm,
  },
  categoryPillsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'center',
    height: 48,
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
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 64,
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
  },
});
