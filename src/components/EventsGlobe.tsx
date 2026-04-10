import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../theme/colors';
import { getTeamByName } from '../data/nflTeams';
import { getMLBTeamByName } from '../data/mlbTeams';
import { initMapbox } from '../lib/mapbox';

initMapbox();

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

const typeEmojis: Record<string, string> = {
  concert: '🎸',
  theater: '🎭',
  comedy: '🎤',
  landmark: '🏰',
  other: '✨',
  sports: '🏆',
};

const typeColors: Record<string, string> = {
  concert: '#A855F7',
  theater: '#3B82F6',
  comedy: '#EF4444',
  landmark: '#22C55E',
  other: '#F59E0B',
  sports: '#6366F1',
};

// Offset in degrees when multiple events share a coordinate (~300-400m)
const OFFSET_DISTANCE = 0.003;

// Label layers in Mapbox Outdoors v12 — hidden to produce a clean, label-free globe.
// Any id that doesn't exist in the current style is a harmless no-op.
const HIDDEN_LABEL_LAYERS = [
  'continent-label',
  'country-label',
  'state-label',
  'settlement-subdivision-label',
  'settlement-minor-label',
  'settlement-major-label',
  'airport-label',
  'poi-label',
  'water-point-label',
  'water-line-label',
  'waterway-label',
  'natural-point-label',
  'natural-line-label',
  'transit-label',
  'road-label',
  'road-label-simple',
  'road-number-shield',
  'road-exit-shield',
  'path-pedestrian-label',
  'ferry-aerialway-label',
  'block-number-label',
  'contour-label',
];

export default function EventsGlobe({ events }: EventsGlobeProps) {
  const cameraRef = useRef<Mapbox.Camera>(null);

  const getEventCoordinates = (event: Event) => {
    if (event.latitude && event.longitude) {
      return {
        latitude: event.latitude,
        longitude: event.longitude,
        team: null,
        isTeamSport: false,
      };
    }
    if (event.sport === 'nfl' && event.home_team) {
      const team = getTeamByName(event.home_team.name);
      if (team) {
        return {
          latitude: team.latitude,
          longitude: team.longitude,
          team,
          isTeamSport: true,
        };
      }
    }
    if (event.sport === 'mlb' && event.home_team) {
      const team = getMLBTeamByName(event.home_team.name);
      if (team) {
        return {
          latitude: team.latitude,
          longitude: team.longitude,
          team,
          isTeamSport: true,
        };
      }
    }
    return null;
  };

  const eventsWithCoords = events
    .map(event => {
      const coords = getEventCoordinates(event);
      if (coords) return { event, ...coords };
      return null;
    })
    .filter(Boolean) as {
      event: Event;
      latitude: number;
      longitude: number;
      team: any;
      isTeamSport: boolean;
    }[];

  // Group events at identical locations and fan them out in a small circle
  const eventsWithOffsets = (() => {
    const groups: Record<string, typeof eventsWithCoords> = {};
    eventsWithCoords.forEach(item => {
      const key = `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const result: Array<
      typeof eventsWithCoords[0] & { displayLat: number; displayLng: number }
    > = [];
    Object.values(groups).forEach(group => {
      group.forEach((item, index) => {
        if (group.length === 1) {
          result.push({ ...item, displayLat: item.latitude, displayLng: item.longitude });
        } else {
          const angle = (2 * Math.PI * index) / group.length;
          result.push({
            ...item,
            displayLat: item.latitude + OFFSET_DISTANCE * Math.cos(angle),
            displayLng: item.longitude + OFFSET_DISTANCE * Math.sin(angle),
          });
        }
      });
    });
    return result;
  })();

  // Initial camera centered on the event cluster (or world view if empty)
  const getInitialCamera = () => {
    if (eventsWithCoords.length === 0) {
      return { centerCoordinate: [0, 20] as [number, number], zoomLevel: 0 };
    }
    const lats = eventsWithCoords.map(e => e.latitude);
    const lngs = eventsWithCoords.map(e => e.longitude);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    return {
      centerCoordinate: [centerLng, centerLat] as [number, number],
      zoomLevel: eventsWithCoords.length === 1 ? 4 : 1.5,
    };
  };

  const initialCamera = getInitialCamera();

  // Re-center when events change
  useEffect(() => {
    cameraRef.current?.setCamera({
      centerCoordinate: initialCamera.centerCoordinate,
      zoomLevel: initialCamera.zoomLevel,
      animationDuration: 800,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  if (eventsWithCoords.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🌍</Text>
        <Text style={styles.emptyText}>No events with locations yet</Text>
        <Text style={styles.emptySubtext}>Add events to see them on the globe</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Outdoors}
        projection="globe"
        scaleBarEnabled={false}
        attributionEnabled={true}
        logoEnabled={true}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initialCamera.centerCoordinate,
            zoomLevel: initialCamera.zoomLevel,
          }}
        />

        {/* Space atmosphere: black sky, subtle stars, soft horizon glow */}
        <Mapbox.Atmosphere
          style={{
            color: '#a8c8ff',
            highColor: '#000814',
            spaceColor: '#000000',
            horizonBlend: 0.04,
            starIntensity: 0.4,
          }}
        />

        {/* Hide all text labels so the globe reads as pure terrain */}
        {HIDDEN_LABEL_LAYERS.map(layerId => (
          <Mapbox.SymbolLayer
            key={layerId}
            id={layerId}
            existing
            style={{ visibility: 'none' }}
          />
        ))}

        {eventsWithOffsets.map(({ event, displayLat, displayLng, team, isTeamSport }) => (
          <Mapbox.MarkerView
            key={event.id}
            coordinate={[displayLng, displayLat]}
            anchor={{ x: 0.5, y: 0.5 }}
            allowOverlap={true}
          >
            {isTeamSport && team ? (
              <View style={[styles.markerContainer, { borderColor: team.primaryColor }]}>
                <Image source={team.logo} style={styles.markerLogo} />
              </View>
            ) : (
              <View
                style={[
                  styles.emojiMarkerContainer,
                  { borderColor: typeColors[event.type] || '#6B7280' },
                ]}
              >
                <Text style={styles.emojiMarker}>{typeEmojis[event.type] || '🎫'}</Text>
              </View>
            )}
          </Mapbox.MarkerView>
        ))}
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    padding: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  markerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerLogo: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  emojiMarkerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emojiMarker: {
    fontSize: 22,
  },
});
