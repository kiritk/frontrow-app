import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { COLORS } from '../theme/colors';
import { getTeamByName } from '../data/nflTeams';
import { getMLBTeamByName } from '../data/mlbTeams';
import { initMapbox } from '../lib/mapbox';

// Only this module touches @rnmapbox/maps. It is loaded lazily from
// EventsGlobe.tsx and only when the native module is linked — so it
// never runs in Expo Go.

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

interface EventsGlobeImplProps {
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

const OFFSET_DISTANCE = 0.003;

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

export default function EventsGlobeImpl({ events }: EventsGlobeImplProps) {
  const cameraRef = useRef<Mapbox.Camera>(null);

  const getEventCoordinates = (event: Event) => {
    if (event.latitude && event.longitude) {
      return { latitude: event.latitude, longitude: event.longitude, team: null, isTeamSport: false };
    }
    if (event.sport === 'nfl' && event.home_team) {
      const team = getTeamByName(event.home_team.name);
      if (team) return { latitude: team.latitude, longitude: team.longitude, team, isTeamSport: true };
    }
    if (event.sport === 'mlb' && event.home_team) {
      const team = getMLBTeamByName(event.home_team.name);
      if (team) return { latitude: team.latitude, longitude: team.longitude, team, isTeamSport: true };
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

  const initialCamera = {
    centerCoordinate: [0, 20] as [number, number],
    zoomLevel: 0,
  };

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.SatelliteStreets}
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

        <Mapbox.Atmosphere
          style={{
            color: '#4da6ff',
            highColor: '#1a3a6e',
            spaceColor: '#000000',
            horizonBlend: 0.1,
            starIntensity: 0.3,
          }}
        />

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
