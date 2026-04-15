import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../theme/colors';
import { isMapboxNativeAvailable } from '../lib/mapbox';

interface Event {
  id: string;
  title: string;
  type: string;
  sport?: string;
  venue: string;
  date: string;
  latitude?: number;
  longitude?: number;
  home_team?: { name: string; city: string; fullName: string };
  away_team?: { name: string; city: string; fullName: string };
}

interface EventsGlobeProps {
  events: Event[];
}

// Lazily load the real Mapbox-backed component ONLY when the native module
// is linked. In Expo Go (no native module) we never touch @rnmapbox/maps, so
// its import-time native access never fires and the app boots normally.
let EventsGlobeImpl: React.ComponentType<EventsGlobeProps> | null = null;
if (isMapboxNativeAvailable) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    EventsGlobeImpl = require('./EventsGlobeImpl').default;
  } catch (err) {
    console.warn('[EventsGlobe] Failed to load Mapbox implementation:', err);
  }
}

export default function EventsGlobe(props: EventsGlobeProps) {
  if (!EventsGlobeImpl) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderEmoji}>🌍</Text>
        <Text style={styles.placeholderTitle}>Globe preview</Text>
        <Text style={styles.placeholderSubtitle}>
          Map renders in a dev build (Expo Go doesn't include the Mapbox native module).
        </Text>
      </View>
    );
  }
  return <EventsGlobeImpl {...props} />;
}

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1a2f',
    padding: SPACING.xl,
  },
  placeholderEmoji: {
    fontSize: 72,
    marginBottom: SPACING.md,
  },
  placeholderTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: '#9fb3d4',
    textAlign: 'center',
    marginTop: SPACING.xs,
    maxWidth: 280,
  },
});
