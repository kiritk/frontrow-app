import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchEvents as fetchEventsFromService } from '../lib/eventService';
import EventsGlobe from '../components/EventsGlobe';
import { COLORS, SPACING, FONTS } from '../theme/colors';

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
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: COLORS.navy,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  mapWrapper: {
    flex: 1,
    marginBottom: 100,
    overflow: 'hidden',
  },
});
