import { LocalEvent } from './localStorage';
import { parseEventDate } from './dates';

export interface EventStats {
  eventCount: number;
  cityCount: number;
  venueCount: number;
  yearCount: number;
}

export interface ExtendedEventStats extends EventStats {
  firstEvent: LocalEvent | null;
  favoriteVenue: { name: string; count: number } | null;
  favoriteCity:  { name: string; count: number } | null;
  eventsByType:  { type: string; count: number }[];
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
          const year = parseEventDate(e.date).getFullYear();
          return Number.isFinite(year) ? year : null;
        })
        .filter((y): y is number => y !== null),
    ).size,
  };
}

function topEntry(map: Map<string, number>): { name: string; count: number } | null {
  let top: { name: string; count: number } | null = null;
  map.forEach((count, name) => {
    if (!top || count > top.count) top = { name, count };
  });
  return top;
}

export function computeExtendedStats(events: LocalEvent[]): ExtendedEventStats {
  const base = computeEventStats(events);
  if (events.length === 0) {
    return { ...base, firstEvent: null, favoriteVenue: null, favoriteCity: null, eventsByType: [] };
  }

  const firstEvent = [...events].sort(
    (a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime(),
  )[0];

  const venueCounts = new Map<string, number>();
  const cityCounts  = new Map<string, number>();
  const typeCounts  = new Map<string, number>();

  events.forEach(e => {
    if (e.venue)          venueCounts.set(e.venue, (venueCounts.get(e.venue) ?? 0) + 1);
    if (e.venue_location) cityCounts.set(e.venue_location, (cityCounts.get(e.venue_location) ?? 0) + 1);
    typeCounts.set(e.type, (typeCounts.get(e.type) ?? 0) + 1);
  });

  const eventsByType = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  return {
    ...base,
    firstEvent,
    favoriteVenue: topEntry(venueCounts),
    favoriteCity:  topEntry(cityCounts),
    eventsByType,
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
