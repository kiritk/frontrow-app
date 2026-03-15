import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, ScrollView, Share, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { COLORS, SPACING, FONTS } from '../theme/colors';

const APP_LOGO = require('../../assets/images/app logo.png');

const CATEGORY_FILTERS = [
  { value: 'sports', label: 'Sports', icon: 'trophy-outline' as const },
  { value: 'concert', label: 'Concerts', icon: 'musical-notes-outline' as const },
  { value: 'theater', label: 'Theater', icon: 'pricetag-outline' as const },
  { value: 'comedy', label: 'Comedy', icon: 'mic-outline' as const },
  { value: 'landmark', label: 'Landmarks', icon: 'business-outline' as const },
  { value: 'other', label: 'Other', icon: 'grid-outline' as const },
];

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (error) { 
      console.error('Error fetching events:', error); 
    } finally { 
      setLoading(false); 
    }
  }, [user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const onRefresh = async () => { setRefreshing(true); await fetchEvents(); setRefreshing(false); };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (error) { console.error('Error deleting event:', error); }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my Front Row collection! I've attended ${events.length} events.`,
        title: 'Front Row',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const years = useMemo(() => {
    const yearSet = new Set<string>();
    events.forEach(event => {
      const year = new Date(event.date).getFullYear().toString();
      yearSet.add(year);
    });
    return Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, [events]);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (selectedYear === 'upcoming') {
      const today = new Date();
      filtered = filtered.filter(event => new Date(event.date) >= today);
    } else if (selectedYear !== 'all') {
      filtered = filtered.filter(event => new Date(event.date).getFullYear().toString() === selectedYear);
    }
    if (selectedCategory) {
      filtered = filtered.filter(event => event.type === selectedCategory);
    }
    return filtered;
  }, [events, selectedYear, selectedCategory]);

  const toggleCategory = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const renderEvent = ({ item }: { item: any }) => (
    <EventCard event={item} onDelete={() => handleDeleteEvent(item.id)} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🎫</Text>
      <Text style={styles.emptyTitle}>No events yet</Text>
      <Text style={styles.emptySubtitle}>Tap the + button to add your first event</Text>
    </View>
  );

  const renderFilteredEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyTitle}>No events found</Text>
      <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
    </View>
  );

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.navy} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* App Header */}
      <View style={styles.appHeader}>
        <Image source={APP_LOGO} style={styles.appLogo} resizeMode="contain" />
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      {/* List/Map Toggle */}
      {events.length > 0 && (
        <View style={styles.toggleContainer}>
          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={16} color={viewMode === 'list' ? COLORS.white : COLORS.navy} />
              <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons name="map-outline" size={16} color={viewMode === 'map' ? COLORS.white : COLORS.navy} />
              <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
      </View>

      {/* Year Tabs */}
      {events.length > 0 && (
        <View style={styles.yearTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearTabs}>
            <TouchableOpacity style={styles.yearTab} onPress={() => setSelectedYear('upcoming')}>
              <Text style={[styles.yearTabText, selectedYear === 'upcoming' && styles.yearTabTextActive]}>Upcoming</Text>
              {selectedYear === 'upcoming' && <View style={styles.yearTabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.yearTab} onPress={() => setSelectedYear('all')}>
              <Text style={[styles.yearTabText, selectedYear === 'all' && styles.yearTabTextActive]}>All</Text>
              {selectedYear === 'all' && <View style={styles.yearTabIndicator} />}
            </TouchableOpacity>
            {years.map(year => (
              <TouchableOpacity key={year} style={styles.yearTab} onPress={() => setSelectedYear(year)}>
                <Text style={[styles.yearTabText, selectedYear === year && styles.yearTabTextActive]}>{year}</Text>
                {selectedYear === year && <View style={styles.yearTabIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.yearTabsDivider} />
        </View>
      )}

      {/* Category Pills */}
      {events.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryPills}
          style={styles.categoryContainer}
        >
          {CATEGORY_FILTERS.map(category => (
            <TouchableOpacity
              key={category.value}
              style={[styles.categoryPill, selectedCategory === category.value && styles.categoryPillActive]}
              onPress={() => toggleCategory(category.value)}
            >
              <Ionicons 
                name={category.icon} 
                size={14} 
                color={selectedCategory === category.value ? COLORS.white : COLORS.navy} 
              />
              <Text style={[styles.categoryText, selectedCategory === category.value && styles.categoryTextActive]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      {viewMode === 'list' ? (
        <FlatList
          data={filteredEvents}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={filteredEvents.length > 0 ? styles.row : undefined}
          contentContainerStyle={[styles.listContent, filteredEvents.length === 0 && styles.emptyListContent]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={events.length === 0 ? renderEmptyState : renderFilteredEmptyState}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
        />
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderEmoji}>🗺️</Text>
          <Text style={styles.mapPlaceholderText}>Map view coming soon</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream },
  
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  appLogo: {
    height: 32,
    width: 120,
  },
  shareButton: { padding: 4 },

  toggleContainer: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 3,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 17,
    gap: 4,
  },
  toggleButtonActive: { backgroundColor: COLORS.navy },
  toggleText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.navy,
  },
  toggleTextActive: { color: COLORS.white },

  header: { 
    paddingHorizontal: 24, 
    paddingBottom: 8,
  },
  title: { 
    fontFamily: FONTS.bold, 
    fontSize: 28, 
    color: COLORS.navy,
  },

  yearTabsContainer: { marginBottom: 8 },
  yearTabs: {
    paddingHorizontal: 24,
    gap: 20,
    paddingBottom: 8,
  },
  yearTab: { position: 'relative' },
  yearTabText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.grayLight,
  },
  yearTabTextActive: {
    fontFamily: FONTS.semiBold,
    color: COLORS.navy,
  },
  yearTabIndicator: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.navy,
    borderRadius: 1,
  },
  yearTabsDivider: {
    height: 1,
    backgroundColor: COLORS.creamDark,
    marginHorizontal: 16,
    marginTop: 4,
  },

  categoryContainer: { 
    maxHeight: 44,
    marginBottom: 12,
  },
  categoryPills: {
    paddingHorizontal: 24,
    gap: 8,
    alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.creamDark,
  },
  categoryPillActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  categoryText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.navy,
  },
  categoryTextActive: { color: COLORS.white },

  listContent: { 
    paddingHorizontal: 24, 
    paddingBottom: 120,
    paddingTop: 4,
  },
  emptyListContent: { flexGrow: 1 },
  row: { 
    justifyContent: 'space-between',
    gap: 12,
  },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontFamily: FONTS.semiBold, fontSize: 18, color: COLORS.navy, marginBottom: 4 },
  emptySubtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray, textAlign: 'center' },

  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderEmoji: { fontSize: 48, marginBottom: 12 },
  mapPlaceholderText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.gray,
  },
});
