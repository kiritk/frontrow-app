import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme/colors';
import { getTeamByName } from '../data/nflTeams';
import { getMLBTeamByName } from '../data/mlbTeams';

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

interface EventsMapProps {
  events: Event[];
}

export default function EventsMap({ events }: EventsMapProps) {
  // Get coordinates for an event
  const getEventCoordinates = (event: Event) => {
    if (event.sport === 'nfl' && event.home_team) {
      const team = getTeamByName(event.home_team.name);
      if (team) {
        return { latitude: team.latitude, longitude: team.longitude, team };
      }
    }
    if (event.sport === 'mlb' && event.home_team) {
      const team = getMLBTeamByName(event.home_team.name);
      if (team) {
        return { latitude: team.latitude, longitude: team.longitude, team };
      }
    }
    return null;
  };

  // Filter events that have coordinates
  const eventsWithCoords = events
    .map(event => {
      const coords = getEventCoordinates(event);
      if (coords) {
        return { event, ...coords };
      }
      return null;
    })
    .filter(Boolean) as { event: Event; latitude: number; longitude: number; team: any }[];

  // Calculate initial region to fit all markers
  const getInitialRegion = () => {
    if (eventsWithCoords.length === 0) {
      // Default to US center
      return {
        latitude: 39.8283,
        longitude: -98.5795,
        latitudeDelta: 40,
        longitudeDelta: 40,
      };
    }

    if (eventsWithCoords.length === 1) {
      return {
        latitude: eventsWithCoords[0].latitude,
        longitude: eventsWithCoords[0].longitude,
        latitudeDelta: 2,
        longitudeDelta: 2,
      };
    }

    const lats = eventsWithCoords.map(e => e.latitude);
    const lngs = eventsWithCoords.map(e => e.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.5 + 2;
    const lngDelta = (maxLng - minLng) * 1.5 + 2;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (eventsWithCoords.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🗺️</Text>
        <Text style={styles.emptyText}>No events with locations yet</Text>
        <Text style={styles.emptySubtext}>Add NFL or MLB events to see them on the map</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={getInitialRegion()}
      showsUserLocation={true}
      showsCompass={true}
    >
      {eventsWithCoords.map(({ event, latitude, longitude, team }) => (
        <Marker
          key={event.id}
          coordinate={{ latitude, longitude }}
          title={event.title}
          description={event.venue}
        >
          {/* Custom marker with team logo */}
          <View style={[styles.markerContainer, { borderColor: team.primaryColor }]}>
            <Image source={team.logo} style={styles.markerLogo} />
          </View>
          
          {/* Custom callout */}
          <Callout style={styles.callout}>
            <View style={styles.calloutContent}>
              <Text style={styles.calloutTitle}>{event.title}</Text>
              <Text style={styles.calloutVenue}>{event.venue}</Text>
              <Text style={styles.calloutDate}>{formatDate(event.date)}</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
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
  callout: {
    width: 200,
  },
  calloutContent: {
    padding: SPACING.sm,
  },
  calloutTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
    marginBottom: 2,
  },
  calloutVenue: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  calloutDate: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.navy,
    marginTop: 4,
  },
});
