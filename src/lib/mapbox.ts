import Mapbox from '@rnmapbox/maps';

// Public Mapbox access token (starts with pk.)
// Get one at: https://account.mapbox.com/access-tokens/
export const MAPBOX_PUBLIC_TOKEN = 'REPLACE_WITH_YOUR_PUBLIC_TOKEN';

let initialized = false;

export function initMapbox() {
  if (initialized) return;
  Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);
  initialized = true;
}
