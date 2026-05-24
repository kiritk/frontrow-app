import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchEvents as fetchEventsFromService } from '../lib/eventService';
import EventsGlobe from '../components/EventsGlobe';
import AppHeader from '../components/AppHeader';
import { LocalEvent } from '../lib/localStorage';
import { COLORS, SPACING, FONTS } from '../theme/colors';

export default function MapScreen() {
  const { user, localEventsVersion } = useAuth();
  const navigation = useNavigation();
  const [events, setEvents] = useState<LocalEvent[]>([]);

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
      <AppHeader />
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
    fontFamily: FONTS.instrumentSerifItalic,
    fontSize: 34,
    color: COLORS.navy,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  mapWrapper: {
    flex: 1,
    marginBottom: 100,
    overflow: 'hidden',
  },
});
