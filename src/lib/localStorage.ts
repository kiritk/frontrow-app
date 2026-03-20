import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_EVENTS_KEY = 'frontrow_local_events';

export interface LocalEvent {
  id: string;
  title: string;
  type: string;
  sport?: string;
  venue: string;
  venue_location?: string;
  date: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
  home_team?: { name: string; city: string; fullName: string };
  away_team?: { name: string; city: string; fullName: string };
  created_at: string;
}

// Generate a unique ID for local events
export const generateLocalId = (): string => {
  return 'local_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get all local events
export const getLocalEvents = async (): Promise<LocalEvent[]> => {
  try {
    const eventsJson = await AsyncStorage.getItem(LOCAL_EVENTS_KEY);
    if (eventsJson) {
      return JSON.parse(eventsJson);
    }
    return [];
  } catch (error) {
    console.error('Error getting local events:', error);
    return [];
  }
};

// Save a new local event
export const saveLocalEvent = async (event: Omit<LocalEvent, 'id' | 'created_at'>): Promise<LocalEvent> => {
  try {
    const events = await getLocalEvents();
    const newEvent: LocalEvent = {
      ...event,
      id: generateLocalId(),
      created_at: new Date().toISOString(),
    };
    events.unshift(newEvent);
    await AsyncStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events));
    return newEvent;
  } catch (error) {
    console.error('Error saving local event:', error);
    throw error;
  }
};

// Update a local event
export const updateLocalEvent = async (id: string, updates: Partial<LocalEvent>): Promise<void> => {
  try {
    const events = await getLocalEvents();
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      await AsyncStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events));
    }
  } catch (error) {
    console.error('Error updating local event:', error);
    throw error;
  }
};

// Delete a local event
export const deleteLocalEvent = async (id: string): Promise<void> => {
  try {
    const events = await getLocalEvents();
    const filtered = events.filter(e => e.id !== id);
    await AsyncStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting local event:', error);
    throw error;
  }
};

// Clear all local events (after migration to account)
export const clearLocalEvents = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOCAL_EVENTS_KEY);
  } catch (error) {
    console.error('Error clearing local events:', error);
    throw error;
  }
};

// Get count of local events
export const getLocalEventsCount = async (): Promise<number> => {
  const events = await getLocalEvents();
  return events.length;
};
