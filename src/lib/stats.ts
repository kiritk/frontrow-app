import { LocalEvent } from './localStorage';

export interface EventStats {
  eventCount: number;
  cityCount: number;
  venueCount: number;
  yearCount: number;
}

export function computeEventStats(events: LocalEvent[]): EventStats {
  return {
    eventCount: events.length,
    cityCount: new Set(events.map(e => e.venue_location || e.venue).filter(Boolean)).size,
    venueCount: new Set(events.map(e => e.venue).filter(Boolean)).size,
    yearCount: new Set(
      events
        .map(e => {
          if (!e.date) return null;
          const year = new Date(e.date).getFullYear();
          return Number.isFinite(year) ? year : null;
        })
        .filter((y): y is number => y !== null),
    ).size,
  };
}

export type FanLevelName = 'Rookie' | 'Pro' | 'All-Star' | 'Legend';

export interface FanLevel {
  level: FanLevelName;
  color: string;
  nextLevel: FanLevelName | null;
  eventsToNext: number;
  progress: number;
}

export function getFanLevel(eventCount: number): FanLevel {
  if (eventCount >= 50) {
    return { level: 'Legend', color: '#F59E0B', nextLevel: null, eventsToNext: 0, progress: 1 };
  }
  if (eventCount >= 25) {
    return { level: 'All-Star', color: '#22C55E', nextLevel: 'Legend', eventsToNext: 50 - eventCount, progress: (eventCount - 25) / 25 };
  }
  if (eventCount >= 10) {
    return { level: 'Pro', color: '#DC2626', nextLevel: 'All-Star', eventsToNext: 25 - eventCount, progress: (eventCount - 10) / 15 };
  }
  return { level: 'Rookie', color: '#3B82F6', nextLevel: 'Pro', eventsToNext: 10 - eventCount, progress: eventCount / 10 };
}
