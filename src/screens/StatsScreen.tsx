import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';
import { getTeamByName } from '../data/nflTeams';
import { getMLBTeamByName } from '../data/mlbTeams';
import Svg, { Circle, G, Path, Rect, Line } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

const TextureBackground = () => {
  const mapW = SCREEN_WIDTH;
  const mapH = SCREEN_HEIGHT * 2;
  const opacity = 0.15;
  const stroke = '#8B7355';

  // Compass rose center (bottom-left area, like the reference image)
  const cx1 = mapW * 0.15;
  const cy1 = mapH * 0.38;
  const r1 = 70;

  // Smaller compass/helm (top-right area)
  const cx2 = mapW * 0.82;
  const cy2 = mapH * 0.12;
  const r2 = 45;

  const compassPoints = (cx: number, cy: number, r: number, points: number) => {
    const paths: string[] = [];
    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points - 90;
      const rad = (angle * Math.PI) / 180;
      const outerR = i % 2 === 0 ? r : r * 0.55;
      const x = cx + outerR * Math.cos(rad);
      const y = cy + outerR * Math.sin(rad);
      paths.push(`${cx},${cy} ${x},${y}`);
    }
    return paths;
  };

  const compassStar = (cx: number, cy: number, r: number) => {
    const pts = 16;
    let d = '';
    for (let i = 0; i <= pts; i++) {
      const angle = (i * 360) / pts - 90;
      const rad = (angle * Math.PI) / 180;
      const outerR = i % 2 === 0 ? r : r * 0.4;
      const x = cx + outerR * Math.cos(rad);
      const y = cy + outerR * Math.sin(rad);
      d += (i === 0 ? 'M' : 'L') + `${x},${y} `;
    }
    return d + 'Z';
  };

  // Rhumb lines radiating from compass centers
  const rhumbLines = (cx: number, cy: number, count: number, length: number) => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const rad = (angle * Math.PI) / 180;
      lines.push({
        x1: cx,
        y1: cy,
        x2: cx + length * Math.cos(rad),
        y2: cy + length * Math.sin(rad),
      });
    }
    return lines;
  };

  // Generate grid lines directly (Pattern fills don't render in react-native-svg)
  const gridSpacing = 50;
  const verticalGridLines = Array.from({ length: Math.ceil(mapW / gridSpacing) + 1 }).map((_, i) => i * gridSpacing);
  const horizontalGridLines = Array.from({ length: Math.ceil(mapH / gridSpacing) + 1 }).map((_, i) => i * gridSpacing);

  // Generate paper fiber texture marks directly
  const fiberRows = Math.ceil(mapH / 60);
  const fiberCols = Math.ceil(mapW / 60);

  return (
    <View style={styles.textureContainer} pointerEvents="none">
      <Svg width={mapW} height={mapH} style={styles.textureSvg}>

        {/* Paper fiber texture - rendered directly instead of via Pattern */}
        {Array.from({ length: fiberRows }).map((_, row) =>
          Array.from({ length: fiberCols }).map((_, col) => {
            const ox = col * 60;
            const oy = row * 60;
            return (
              <G key={`fiber-${row}-${col}`}>
                <Line x1={ox + 5} y1={oy + 12} x2={ox + 15} y2={oy + 13} stroke="#E0DAD0" strokeWidth="0.5" opacity="0.4" />
                <Line x1={ox + 35} y1={oy + 8} x2={ox + 42} y2={oy + 9} stroke="#DDD7CB" strokeWidth="0.4" opacity="0.3" />
                <Line x1={ox + 48} y1={oy + 25} x2={ox + 56} y2={oy + 26} stroke="#E0DAD0" strokeWidth="0.5" opacity="0.35" />
                <Line x1={ox + 12} y1={oy + 38} x2={ox + 22} y2={oy + 39} stroke="#DDD7CB" strokeWidth="0.4" opacity="0.4" />
                <Circle cx={ox + 10} cy={oy + 20} r={0.6} fill="#D5CFC3" opacity="0.3" />
                <Circle cx={ox + 45} cy={oy + 15} r={0.5} fill="#DBD5C9" opacity="0.25" />
                <Circle cx={ox + 25} cy={oy + 42} r={0.6} fill="#D5CFC3" opacity="0.35" />
              </G>
            );
          })
        )}

        {/* Map grid overlay - rendered as direct lines */}
        {verticalGridLines.map((x, i) => (
          <Line key={`gv-${i}`} x1={x} y1={0} x2={x} y2={mapH} stroke={stroke} strokeWidth="0.5" opacity={0.045} />
        ))}
        {horizontalGridLines.map((y, i) => (
          <Line key={`gh-${i}`} x1={0} y1={y} x2={mapW} y2={y} stroke={stroke} strokeWidth="0.5" opacity={0.045} />
        ))}

        {/* Rhumb lines from bottom-left compass */}
        {rhumbLines(cx1, cy1, 32, Math.max(mapW, mapH)).map((l, i) => (
          <Line
            key={`rhumb1-${i}`}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={stroke}
            strokeWidth={i % 4 === 0 ? 0.8 : 0.4}
            opacity={i % 4 === 0 ? opacity : opacity * 0.5}
          />
        ))}

        {/* Rhumb lines from top-right compass */}
        {rhumbLines(cx2, cy2, 16, Math.max(mapW, mapH) * 0.6).map((l, i) => (
          <Line
            key={`rhumb2-${i}`}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={stroke}
            strokeWidth={0.4}
            opacity={opacity * 0.4}
          />
        ))}

        {/* Bottom-left compass rose */}
        <G opacity={opacity * 2.5}>
          <Circle cx={cx1} cy={cy1} r={r1} stroke={stroke} strokeWidth="1.2" fill="none" />
          <Circle cx={cx1} cy={cy1} r={r1 * 0.85} stroke={stroke} strokeWidth="0.6" fill="none" />
          <Circle cx={cx1} cy={cy1} r={r1 * 0.15} stroke={stroke} strokeWidth="0.8" fill={stroke} opacity="0.3" />
          <Path d={compassStar(cx1, cy1, r1 * 0.8)} stroke={stroke} strokeWidth="0.8" fill={stroke} opacity="0.15" />
          {/* Degree tick marks */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const inner = i % 9 === 0 ? r1 * 0.88 : r1 * 0.93;
            return (
              <Line
                key={`tick1-${i}`}
                x1={cx1 + inner * Math.cos(angle)}
                y1={cy1 + inner * Math.sin(angle)}
                x2={cx1 + r1 * Math.cos(angle)}
                y2={cy1 + r1 * Math.sin(angle)}
                stroke={stroke}
                strokeWidth={i % 9 === 0 ? 1 : 0.4}
              />
            );
          })}
        </G>

        {/* Top-right helm/compass */}
        <G opacity={opacity * 2}>
          <Circle cx={cx2} cy={cy2} r={r2} stroke={stroke} strokeWidth="1" fill="none" />
          <Circle cx={cx2} cy={cy2} r={r2 * 0.7} stroke={stroke} strokeWidth="0.5" fill="none" />
          <Circle cx={cx2} cy={cy2} r={r2 * 0.12} stroke={stroke} strokeWidth="0.6" fill={stroke} opacity="0.3" />
          <Path d={compassStar(cx2, cy2, r2 * 0.65)} stroke={stroke} strokeWidth="0.6" fill={stroke} opacity="0.12" />
          {/* Helm spokes */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            return (
              <Line
                key={`spoke-${i}`}
                x1={cx2 + r2 * 0.7 * Math.cos(angle)}
                y1={cy2 + r2 * 0.7 * Math.sin(angle)}
                x2={cx2 + r2 * 1.08 * Math.cos(angle)}
                y2={cy2 + r2 * 1.08 * Math.sin(angle)}
                stroke={stroke}
                strokeWidth="1.5"
              />
            );
          })}
          {/* Helm handle circles */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            return (
              <Circle
                key={`handle-${i}`}
                cx={cx2 + r2 * 1.12 * Math.cos(angle)}
                cy={cy2 + r2 * 1.12 * Math.sin(angle)}
                r={3}
                stroke={stroke}
                strokeWidth="0.8"
                fill="none"
              />
            );
          })}
        </G>

        {/* Decorative border dashes (top) */}
        {Array.from({ length: Math.ceil(mapW / 20) }).map((_, i) => (
          <React.Fragment key={`border-${i}`}>
            <Rect x={i * 20} y={0} width={10} height={6} fill={stroke} opacity={0.12} />
            <Rect x={i * 20 + 10} y={0} width={10} height={6} fill={stroke} opacity={0.04} />
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

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
      <TextureBackground />
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
  textureContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  textureSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
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
