import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchEvents as fetchEventsFromService } from '../lib/eventService';
import EventsGlobe from '../components/EventsGlobe';
import { COLORS, SPACING } from '../theme/colors';

interface Event {
  id: string;
  title: string;
  type: string;
  sport?: string;
  venue: string;
  venue_location?: string;
  date: string;
  photos?: string[];
  cover_photo?: string;
  latitude?: number;
  longitude?: number;
  home_team?: { name: string; city: string; fullName: string };
  away_team?: { name: string; city: string; fullName: string };
}

export default function MapScreen() {
  const { user, localEventsVersion } = useAuth();
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);

  const fetchEvents = useCallback(async () => {
    try {
      const allEvents = await fetchEventsFromService(user?.id);
      setEvents(allEvents);
    } catch (error) {
      console.error('[MapScreen] Error fetching events:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, localEventsVersion]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchEvents);
    return unsubscribe;
  }, [navigation, fetchEvents]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>Map</Text>
      <View style={styles.mapWrapper}>
        <EventsGlobe events={events} />
        <LinearGradient
          colors={[COLORS.cream, 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', COLORS.cream]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  pageTitle: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: 32,
    color: COLORS.navy,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  mapWrapper: {
    flex: 1,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
});
