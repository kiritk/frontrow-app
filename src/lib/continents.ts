// Very-rough continent detection from lat/lng.
// Good enough for a filter UI — exact borders not required.

import { getTeamByName } from '../data/nflTeams';
import { getMLBTeamByName } from '../data/mlbTeams';

export type Continent =
  | 'North America'
  | 'South America'
  | 'Europe'
  | 'Africa'
  | 'Asia'
  | 'Oceania'
  | 'Antarctica';

export function continentFromLatLng(lat: number, lng: number): Continent | null {
  // Antarctica
  if (lat < -60) return 'Antarctica';

  // Oceania (Australia / New Zealand / Pacific)
  if (lat < 0 && lng > 110 && lng < 180) return 'Oceania';
  if (lat < 10 && lat > -50 && lng > 150) return 'Oceania';

  // South America
  if (lat < 15 && lng > -90 && lng < -30) return 'South America';

  // North America (incl. Central America + Caribbean)
  if (lat >= 15 && lng > -170 && lng < -50) return 'North America';
  if (lat >= 7 && lat < 15 && lng > -120 && lng < -60) return 'North America';

  // Europe
  if (lat > 35 && lng > -25 && lng < 60) return 'Europe';

  // Africa
  if (lat <= 37 && lat > -40 && lng > -20 && lng < 55) return 'Africa';

  // Asia (catch-all east of Europe / north of Oceania)
  if (lng > 25 && lng < 180 && lat > -10) return 'Asia';

  return null;
}

interface EventLike {
  latitude?: number;
  longitude?: number;
  sport?: string;
  home_team?: { name: string };
}

// Resolve a continent for an event, using its direct coords when available,
// otherwise looking up the home team's location.
export function continentForEvent(event: EventLike): Continent | null {
  if (event.latitude != null && event.longitude != null) {
    return continentFromLatLng(event.latitude, event.longitude);
  }
  if (event.sport === 'nfl' && event.home_team) {
    const team = getTeamByName(event.home_team.name);
    if (team) return continentFromLatLng(team.latitude, team.longitude);
  }
  if (event.sport === 'mlb' && event.home_team) {
    const team = getMLBTeamByName(event.home_team.name);
    if (team) return continentFromLatLng(team.latitude, team.longitude);
  }
  return null;
}
