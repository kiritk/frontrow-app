import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';
import { getTeamByName } from '../data/nflTeams';
import { getMLBTeamByName } from '../data/mlbTeams';
import Svg, { Circle, G, Path } from 'react-native-svg';

interface Event {
  id: string;
  title: string;
  type: string;
  sport?: string;
  venue: string;
  date: string;
  home_team?: { name: string; city: string; fullName: string };
  away_team?: { name: string; city: string; fullName: string };
}

export default function StatsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const fetchEvents = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('events').select('*').eq('user_id', user.id);
      setEvents(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  // Get unique years from events
  const getYears = () => {
    const years = new Set<number>();
    events.forEach(e => {
      const year = new Date(e.date).getFullYear();
      years.add(year);
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  };

  // Get monthly event counts for selected year
  const getMonthlyData = () => {
    const months = Array(12).fill(0);
    events.forEach(e => {
      const date = new Date(e.date);
      if (date.getFullYear() === selectedYear) {
        months[date.getMonth()]++;
      }
    });
    return months;
  };

  // Get event type distribution (all time)
  const getEventTypeData = () => {
    const types: Record<string, number> = {};
    events.forEach(e => {
      const type = e.type || 'other';
      types[type] = (types[type] || 0) + 1;
    });
    return types;
  };

  // Get most visited venue with team info (NFL/MLB only)
  const getMostVisitedVenue = () => {
    const venueCounts: Record<string, { count: number; event: Event }> = {};
    
    // Only consider NFL and MLB events
    events.forEach(e => {
      if (e.venue && (e.sport === 'nfl' || e.sport === 'mlb') && e.home_team) {
        if (!venueCounts[e.venue]) {
          venueCounts[e.venue] = { count: 0, event: e };
        }
        venueCounts[e.venue].count++;
      }
    });

    let maxVenue = null;
    let maxCount = 0;
    Object.entries(venueCounts).forEach(([venue, data]) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        maxVenue = { venue, count: data.count, event: data.event };
      }
    });

    return maxVenue;
  };

  const monthlyData = getMonthlyData();
  const maxMonthlyCount = Math.max(...monthlyData, 1);
  const eventTypeData = getEventTypeData();
  const mostVisitedVenue = getMostVisitedVenue();
  const years = getYears();

  const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  const typeColors: Record<string, string> = {
    sports: '#22C55E',
    concert: '#A855F7',
    theater: '#3B82F6',
    comedy: '#EF4444',
    landmark: '#6B7280',
    other: '#F59E0B',
  };

  const typeEmojis: Record<string, string> = {
    sports: '🏆',
    concert: '🎸',
    theater: '🎭',
    comedy: '🎤',
    landmark: '🏰',
    other: '✨',
  };

  // Get team info for most visited venue
  const getVenueTeamInfo = () => {
    if (!mostVisitedVenue) return null;
    const event = mostVisitedVenue.event;
    
    if (event.sport === 'nfl' && event.home_team) {
      return getTeamByName(event.home_team.name);
    }
    if (event.sport === 'mlb' && event.home_team) {
      return getMLBTeamByName(event.home_team.name);
    }
    return null;
  };

  const venueTeam = getVenueTeamInfo();

  // Calculate pie chart segments
  const renderPieChart = () => {
    const total = Object.values(eventTypeData).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    const size = 140;
    const radius = 60;
    const center = size / 2;
    let startAngle = -90;

    const segments: JSX.Element[] = [];
    const types = Object.entries(eventTypeData);

    types.forEach(([type, count], index) => {
      const percentage = count / total;
      const angle = percentage * 360;
      const endAngle = startAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      segments.push(
        <Path
          key={type}
          d={pathData}
          fill={typeColors[type] || '#6B7280'}
        />
      );

      startAngle = endAngle;
    });

    return (
      <Svg width={size} height={size}>
        <G>{segments}</G>
        <Circle cx={center} cy={center} r={35} fill={COLORS.white} />
      </Svg>
    );
  };

  const yearEventsCount = monthlyData.reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />
        }
      >
        {/* Header */}
        <Text style={styles.pageTitle}>Stats</Text>

        {/* Yearly Activity Bar Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Yearly Activity</Text>
            <TouchableOpacity
              style={styles.yearDropdown}
              onPress={() => setShowYearPicker(!showYearPicker)}
            >
              <Text style={styles.yearDropdownText}>{selectedYear}</Text>
              <Text style={styles.yearDropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {showYearPicker && (
            <View style={styles.yearPickerContainer}>
              {years.map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearOption,
                    year === selectedYear && styles.yearOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedYear(year);
                    setShowYearPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.yearOptionText,
                      year === selectedYear && styles.yearOptionTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.barChart}>
            {monthlyData.map((count, index) => (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: count > 0 ? `${(count / maxMonthlyCount) * 100}%` : 0,
                        backgroundColor: count > 0 ? COLORS.navy : 'transparent',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{monthLabels[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.yearSummary}>
            <Text style={styles.yearSummaryBold}>{yearEventsCount}</Text>
            {' '}events in {selectedYear}
          </Text>
        </View>

        {/* Event Type Pie Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Mix</Text>
          <View style={styles.pieChartContainer}>
            <View style={styles.pieChart}>{renderPieChart()}</View>
            <View style={styles.legendContainer}>
              {Object.entries(eventTypeData).length > 0 ? (
                Object.entries(eventTypeData).map(([type, count]) => (
                  <View key={type} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: typeColors[type] || '#6B7280' }]} />
                    <Text style={styles.legendEmoji}>{typeEmojis[type] || '🎫'}</Text>
                    <Text style={styles.legendLabel}>
                      {type.toUpperCase()}
                    </Text>
                    <Text style={styles.legendCount}>{count}</Text>
                  </View>
                ))
              ) : (
                ['sports', 'concert', 'theater', 'comedy', 'landmark'].map(type => (
                  <View key={type} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: typeColors[type] }]} />
                    <Text style={styles.legendEmoji}>{typeEmojis[type]}</Text>
                    <Text style={styles.legendLabel}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                    <Text style={styles.legendCount}>0</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* Favorite Venue Card - Only shown for NFL/MLB events */}
        {mostVisitedVenue && venueTeam && (
          <View style={styles.venueCardWrapper}>
            <ImageBackground
              source={venueTeam?.stadiumImage}
              style={styles.venueCard}
              imageStyle={styles.venueCardImage}
            >
              <LinearGradient
                colors={[
                  (venueTeam?.primaryColor || '#A71930') + 'CC',
                  (venueTeam?.primaryColor || '#A71930') + 'EE',
                ]}
                style={styles.venueCardOverlay}
              >
                <Text style={styles.venueCardLabel}>FAVORITE VENUE</Text>
                <Text style={styles.venueCardName}>{mostVisitedVenue.venue}</Text>
                <Text style={styles.venueCardVisits}>{mostVisitedVenue.count} visits</Text>
              </LinearGradient>
            </ImageBackground>
          </View>
        )}

        {events.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 64 }}>📊</Text>
            <Text style={styles.emptyText}>Add events to see your stats!</Text>
          </View>
        )}
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
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: COLORS.navy,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
  },
  yearDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  yearDropdownText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
  },
  yearDropdownArrow: {
    fontSize: 10,
    color: COLORS.gray,
  },
  yearPickerContainer: {
    backgroundColor: COLORS.cream,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  yearOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  yearOptionSelected: {
    backgroundColor: COLORS.navy,
  },
  yearOptionText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
  },
  yearOptionTextSelected: {
    color: COLORS.white,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: SPACING.md,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    width: '60%',
    justifyContent: 'flex-end',
    marginBottom: SPACING.xs,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 0,
  },
  barLabel: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.gray,
  },
  yearSummary: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
  yearSummaryBold: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieChart: {
    width: 140,
    height: 140,
  },
  legendContainer: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.xs,
  },
  legendEmoji: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  legendLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
    flex: 1,
  },
  legendCount: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  venueCardWrapper: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  venueCard: {
    height: 140,
  },
  venueCardImage: {
    resizeMode: 'cover',
  },
  venueCardOverlay: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  venueCardLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  venueCardName: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  venueCardVisits: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.9)',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginTop: SPACING.md,
  },
});
