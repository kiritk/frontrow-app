import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getLocalEvents } from '../lib/localStorage';
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
  venue_location?: string;
  date: string;
  home_team?: { name: string; city: string; fullName: string };
  away_team?: { name: string; city: string; fullName: string };
}

export default function StatsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const fetchEvents = async () => {
    try {
      const localEvents = await getLocalEvents();
      setEvents(localEvents as Event[]);
    } catch (error) {
      console.error(error);
    }
  };

  // Re-fetch on mount, whenever auth state changes (e.g. logout wipes
  // local events), and whenever the Stats tab regains focus.
  useEffect(() => {
    fetchEvents();
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchEvents);
    return unsubscribe;
  }, [navigation]);

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

  // Filter events to selected year for year-specific stats
  const yearEvents = events.filter(e => new Date(e.date).getFullYear() === selectedYear);

  // Hero year stats
  const getHeroStats = () => {
    const cities = new Set<string>();
    yearEvents.forEach(e => {
      const loc = e.venue_location || e.venue;
      if (loc) cities.add(loc);
    });
    const types: Record<string, number> = {};
    yearEvents.forEach(e => { types[e.type] = (types[e.type] || 0) + 1; });
    const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
    return {
      total: yearEvents.length,
      cities: cities.size,
      topType: topType ? topType[0] : null,
      topTypeCount: topType ? topType[1] : 0,
    };
  };

  // Day of week breakdown (all time)
  const getDayOfWeekData = () => {
    const days = Array(7).fill(0);
    events.forEach(e => {
      const dayIdx = new Date(e.date).getDay();
      days[dayIdx]++;
    });
    return days;
  };

  // Fun facts for selected year
  const getFunFacts = () => {
    if (yearEvents.length === 0) return null;

    // Busiest month in year
    const monthCounts = Array(12).fill(0);
    yearEvents.forEach(e => { monthCounts[new Date(e.date).getMonth()]++; });
    const busiestMonthIdx = monthCounts.indexOf(Math.max(...monthCounts));
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // First event of year
    const sortedByDate = [...yearEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstEvent = sortedByDate[0];

    // Longest gap between events (rest days)
    let longestGap = 0;
    for (let i = 1; i < sortedByDate.length; i++) {
      const diff = (new Date(sortedByDate[i].date).getTime() - new Date(sortedByDate[i - 1].date).getTime()) / (1000 * 60 * 60 * 24);
      if (diff > longestGap) longestGap = Math.round(diff);
    }

    // Busiest day (multiple events on same date)
    const dateCounts: Record<string, number> = {};
    yearEvents.forEach(e => { dateCounts[e.date] = (dateCounts[e.date] || 0) + 1; });
    const peakDay = Math.max(...Object.values(dateCounts), 1);

    return {
      busiestMonth: monthNames[busiestMonthIdx],
      busiestMonthCount: monthCounts[busiestMonthIdx],
      firstEventTitle: firstEvent.title,
      firstEventDate: new Date(firstEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      longestGap,
      peakDay,
    };
  };

  // Unique cities visited (all time)
  const getUniqueCities = () => {
    const cities = new Set<string>();
    events.forEach(e => {
      const loc = e.venue_location || e.venue;
      if (loc) cities.add(loc);
    });
    return Array.from(cities).sort();
  };

  const monthlyData = getMonthlyData();
  const maxMonthlyCount = Math.max(...monthlyData, 1);
  const eventTypeData = getEventTypeData();
  const mostVisitedVenue = getMostVisitedVenue();
  const years = getYears();
  const heroStats = getHeroStats();
  const dayOfWeekData = getDayOfWeekData();
  const maxDayCount = Math.max(...dayOfWeekData, 1);
  const funFacts = getFunFacts();
  const uniqueCities = getUniqueCities();

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

        {/* Hero Year Card */}
        <View style={styles.heroCardWrapper}>
          <LinearGradient
            colors={['#1e3a5f', '#2a6a7a', '#7ab5b0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>YOUR {selectedYear}</Text>
            <Text style={styles.heroMainNumber}>{heroStats.total}</Text>
            <Text style={styles.heroMainLabel}>
              {heroStats.total === 1 ? 'Event' : 'Events'}
            </Text>
            <View style={styles.heroDivider} />
            <View style={styles.heroSubStatsRow}>
              <View style={styles.heroSubStat}>
                <Text style={styles.heroSubNumber}>{heroStats.cities}</Text>
                <Text style={styles.heroSubLabel}>{heroStats.cities === 1 ? 'City' : 'Cities'}</Text>
              </View>
              <View style={styles.heroSubDivider} />
              <View style={styles.heroSubStat}>
                <Text style={styles.heroSubEmoji}>
                  {heroStats.topType ? typeEmojis[heroStats.topType] || '✨' : '—'}
                </Text>
                <Text style={styles.heroSubLabel}>
                  {heroStats.topType ? `${heroStats.topType.charAt(0).toUpperCase()}${heroStats.topType.slice(1)} Fan` : 'Top Type'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Fun Facts - Horizontal Scroll */}
        {funFacts && (
          <View style={styles.funFactsWrapper}>
            <Text style={styles.sectionHeading}>Fun Facts</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.funFactsScroll}
            >
              <View style={[styles.funFactCard, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.funFactEmoji}>🔥</Text>
                <Text style={styles.funFactNumber}>{funFacts.busiestMonthCount}</Text>
                <Text style={styles.funFactLabel}>Events in {funFacts.busiestMonth}</Text>
                <Text style={styles.funFactSubLabel}>Busiest month</Text>
              </View>
              <View style={[styles.funFactCard, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.funFactEmoji}>🎬</Text>
                <Text style={styles.funFactNumber} numberOfLines={1}>{funFacts.firstEventDate}</Text>
                <Text style={styles.funFactLabel} numberOfLines={2}>{funFacts.firstEventTitle}</Text>
                <Text style={styles.funFactSubLabel}>First event</Text>
              </View>
              <View style={[styles.funFactCard, { backgroundColor: '#E9D5FF' }]}>
                <Text style={styles.funFactEmoji}>💤</Text>
                <Text style={styles.funFactNumber}>{funFacts.longestGap}</Text>
                <Text style={styles.funFactLabel}>{funFacts.longestGap === 1 ? 'Day' : 'Days'}</Text>
                <Text style={styles.funFactSubLabel}>Longest gap</Text>
              </View>
              <View style={[styles.funFactCard, { backgroundColor: '#FECACA' }]}>
                <Text style={styles.funFactEmoji}>⚡</Text>
                <Text style={styles.funFactNumber}>{funFacts.peakDay}</Text>
                <Text style={styles.funFactLabel}>In one day</Text>
                <Text style={styles.funFactSubLabel}>Peak day</Text>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Yearly Activity Heatmap */}
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

          <View style={styles.heatmapGrid}>
            {monthlyData.map((count, index) => {
              const intensity = count === 0 ? 0 : count / maxMonthlyCount;
              const bg = count === 0
                ? '#F3F4F6'
                : `rgba(30, 58, 95, ${0.2 + intensity * 0.8})`;
              return (
                <View key={index} style={styles.heatmapCell}>
                  <View style={[styles.heatmapBlock, { backgroundColor: bg }]}>
                    <Text style={[
                      styles.heatmapCount,
                      { color: count === 0 ? COLORS.grayLight : (intensity > 0.5 ? COLORS.white : COLORS.navy) }
                    ]}>
                      {count > 0 ? count : ''}
                    </Text>
                  </View>
                  <Text style={styles.heatmapLabel}>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}</Text>
                </View>
              );
            })}
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

        {/* Day of Week Breakdown */}
        {events.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>When You Go Out</Text>
            <Text style={styles.cardSubtitle}>Your favorite days of the week</Text>
            <View style={styles.dowContainer}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => {
                const count = dayOfWeekData[i];
                const widthPct = (count / maxDayCount) * 100;
                const isTop = count === maxDayCount && count > 0;
                return (
                  <View key={label} style={styles.dowRow}>
                    <Text style={[styles.dowLabel, isTop && styles.dowLabelTop]}>{label}</Text>
                    <View style={styles.dowBarTrack}>
                      <View
                        style={[
                          styles.dowBarFill,
                          {
                            width: `${widthPct}%`,
                            backgroundColor: isTop ? '#D4AF37' : COLORS.navy,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.dowCount, isTop && styles.dowCountTop]}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Cities Visited */}
        {uniqueCities.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Cities Visited</Text>
              <View style={styles.cityCountBadge}>
                <Text style={styles.cityCountText}>{uniqueCities.length}</Text>
              </View>
            </View>
            <View style={styles.cityChipsContainer}>
              {uniqueCities.map((city) => (
                <View key={city} style={styles.cityChip}>
                  <Text style={styles.cityChipIcon}>📍</Text>
                  <Text style={styles.cityChipText} numberOfLines={1}>{city}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
    fontFamily: 'GeistMono_700Bold',
    fontSize: 32,
    color: COLORS.navy,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
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
    borderWidth: 1,
    borderColor: '#E5E5E5',
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
  // Hero card
  heroCardWrapper: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  heroLabel: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  heroMainNumber: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: 72,
    color: COLORS.white,
    lineHeight: 80,
  },
  heroMainLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.lg,
    color: 'rgba(255,255,255,0.9)',
    marginTop: -SPACING.xs,
  },
  heroDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: SPACING.md,
  },
  heroSubStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heroSubStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroSubDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: SPACING.lg,
  },
  heroSubNumber: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: 28,
    color: COLORS.white,
  },
  heroSubEmoji: {
    fontSize: 28,
  },
  heroSubLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Fun facts
  funFactsWrapper: {
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
    marginBottom: SPACING.md,
  },
  funFactsScroll: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  funFactCard: {
    width: 140,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  funFactEmoji: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  funFactNumber: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: 24,
    color: COLORS.navy,
  },
  funFactLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
    marginTop: 2,
  },
  funFactSubLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },

  // Heatmap
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  heatmapCell: {
    width: '24%',
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  heatmapBlock: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heatmapCount: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: 18,
  },
  heatmapLabel: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.gray,
  },

  // Card subtitle
  cardSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.lg,
  },

  // Day of week
  dowContainer: {
    gap: SPACING.sm,
  },
  dowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dowLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    width: 36,
  },
  dowLabelTop: {
    color: COLORS.navy,
    fontFamily: FONTS.bold,
  },
  dowBarTrack: {
    flex: 1,
    height: 18,
    backgroundColor: '#F3F4F6',
    borderRadius: 9,
    overflow: 'hidden',
  },
  dowBarFill: {
    height: '100%',
    borderRadius: 9,
    minWidth: 2,
  },
  dowCount: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    width: 24,
    textAlign: 'right',
  },
  dowCountTop: {
    color: COLORS.navy,
    fontFamily: 'GeistMono_700Bold',
  },

  // Cities
  cityCountBadge: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 32,
    alignItems: 'center',
  },
  cityCountText: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  cityChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
    maxWidth: '100%',
  },
  cityChipIcon: {
    fontSize: 14,
  },
  cityChipText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
    maxWidth: 200,
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
