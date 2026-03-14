import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, Event } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

export default function StatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('events').select('*').eq('user_id', user.id);
      const events = data || [];
      const eventsByType: Record<string, number> = {};
      const cities = new Set<string>();
      let totalRating = 0, ratedEvents = 0;
      events.forEach((e: Event) => {
        eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1;
        if (e.city) cities.add(e.city);
        if (e.rating) { totalRating += e.rating; ratedEvents++; }
      });
      setStats({ totalEvents: events.length, eventsByType, citiesVisited: cities.size, averageRating: ratedEvents > 0 ? totalRating / ratedEvents : 0 });
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchStats(); }, [user]);
  const onRefresh = async () => { setRefreshing(true); await fetchStats(); setRefreshing(false); };

  const emojis: Record<string, string> = { concert: '🎸', sports: '🏆', theater: '🎭', comedy: '🎤', landmark: '🏰', other: '✨' };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Stats</Text>
          <Text style={styles.subtitle}>Your live event journey</Text>
        </View>
        {stats ? (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardLarge]}>
                <Text style={styles.statNumberLarge}>{stats.totalEvents}</Text>
                <Text style={styles.statLabelLarge}>Total Events</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.citiesVisited}</Text>
                <Text style={styles.statLabel}>Cities</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.averageRating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Rating</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Events by Type</Text>
            <View style={styles.typeGrid}>
              {Object.entries(stats.eventsByType).map(([type, count]) => (
                <View key={type} style={styles.typeCard}>
                  <Text style={{fontSize: 28}}>{emojis[type] || '🎫'}</Text>
                  <Text style={styles.typeCount}>{count as number}</Text>
                  <Text style={styles.typeLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={{fontSize: 64}}>📊</Text>
            <Text style={styles.emptyText}>Add events to see stats!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  content: { padding: SPACING.lg },
  header: { marginBottom: SPACING.lg },
  title: { fontFamily: FONTS.bold, fontSize: 32, color: COLORS.navy },
  subtitle: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.gray, marginTop: SPACING.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, alignItems: 'center' },
  statCardLarge: { minWidth: '100%', backgroundColor: COLORS.navy },
  statNumber: { fontFamily: FONTS.bold, fontSize: 40, color: COLORS.navy },
  statNumberLarge: { fontFamily: FONTS.bold, fontSize: 56, color: COLORS.cream },
  statLabel: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.gray, marginTop: SPACING.xs },
  statLabelLarge: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.sm, color: COLORS.creamDark, marginTop: SPACING.xs },
  sectionTitle: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.xl, color: COLORS.navy, marginBottom: SPACING.md },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', minWidth: 90 },
  typeCount: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xl, color: COLORS.navy, marginTop: SPACING.xs },
  typeLabel: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.xs, color: COLORS.gray },
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.gray, marginTop: SPACING.md },
});
