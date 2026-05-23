import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../theme/colors';

// Bright, visually-distinct colors per event type, picked to read well against
// the dark navy card background. Distinct from TYPE_CONFIG (which uses muted
// gradients sized for chip/card use); the chart needs vivid hues to separate
// slices at a glance.
const SLICE_COLORS: Record<string, string> = {
  sports:   '#7CF3A4', // mint green
  concert:  '#B388FF', // violet
  theater:  '#4FC3F7', // sky blue
  comedy:   '#FF6B9D', // pink
  landmark: '#FFD166', // amber
  other:    '#E8E8E8', // off-white
};

const SLICE_LABELS: Record<string, string> = {
  sports:   'Sports',
  concert:  'Concerts',
  theater:  'Theater',
  comedy:   'Comedy',
  landmark: 'Landmarks',
  other:    'Other',
};

const SVG_SIZE = 180;
const CENTER = SVG_SIZE / 2;
const INNER_R = 24;
const MIN_OUTER_R = 50;
const MAX_OUTER_R = 84;

function arcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1o = cx + outerR * Math.cos(startAngle);
  const y1o = cy + outerR * Math.sin(startAngle);
  const x2o = cx + outerR * Math.cos(endAngle);
  const y2o = cy + outerR * Math.sin(endAngle);
  const x1i = cx + innerR * Math.cos(startAngle);
  const y1i = cy + innerR * Math.sin(startAngle);
  const x2i = cx + innerR * Math.cos(endAngle);
  const y2i = cy + innerR * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1i} ${y1i} Z`;
}

type Slice = { type: string; count: number };

export default function EventTypePie({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  const maxCount = Math.max(...slices.map(s => s.count), 1);

  // Single slice → render as an annulus (a 360° arc path collapses to nothing).
  const single = slices.length === 1;

  let cursor = -Math.PI / 2; // start at 12 o'clock
  const slicePaths = slices.map(({ type, count }) => {
    const sweep = (count / total) * Math.PI * 2;
    const outerR = MIN_OUTER_R + (count / maxCount) * (MAX_OUTER_R - MIN_OUTER_R);
    const color = SLICE_COLORS[type] ?? SLICE_COLORS.other;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    return { type, color, start, end, outerR };
  });

  return (
    <View style={styles.container}>
      <Svg width={SVG_SIZE} height={SVG_SIZE}>
        {single ? (
          <>
            <Circle cx={CENTER} cy={CENTER} r={MAX_OUTER_R} fill={slicePaths[0].color} />
            <Circle cx={CENTER} cy={CENTER} r={INNER_R} fill={COLORS.navy} />
          </>
        ) : (
          slicePaths.map(s => (
            <Path
              key={s.type}
              d={arcPath(CENTER, CENTER, INNER_R, s.outerR, s.start, s.end)}
              fill={s.color}
            />
          ))
        )}
        {/* Center dot for donut accent */}
        <Circle cx={CENTER} cy={CENTER} r={12} fill="rgba(255,255,255,0.06)" />
      </Svg>

      <View style={styles.legend}>
        {slices.map(({ type, count }) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SLICE_COLORS[type] ?? SLICE_COLORS.other }]} />
            <Text style={styles.legendLabel}>
              {SLICE_LABELS[type] ?? type}
            </Text>
            <Text style={styles.legendCount}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  legend: {
    flex: 1,
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  legendCount: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
  },
});
