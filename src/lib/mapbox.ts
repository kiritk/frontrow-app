import Mapbox from '@rnmapbox/maps';

// Public Mapbox access token (starts with pk.)
// Set EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN in .env — see .env.example.
export const MAPBOX_PUBLIC_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN ?? '';

let initialized = false;

export function initMapbox() {
  if (initialized) return;
  if (!MAPBOX_PUBLIC_TOKEN) {
    console.warn(
      '[mapbox] EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN is not set — the globe view will not render.',
    );
    return;
  }
  Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);
  initialized = true;
}
