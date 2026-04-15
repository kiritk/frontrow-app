import Mapbox from '@rnmapbox/maps';
import { NativeModules } from 'react-native';

// Public Mapbox access token (starts with pk.)
// Set EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN in .env — see .env.example.
export const MAPBOX_PUBLIC_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN ?? '';

// True when the Mapbox native module is linked (i.e. a dev/prod build, not Expo Go).
export const isMapboxNativeAvailable = !!(
  (NativeModules as any).RNMBXModule || (NativeModules as any).MGLModule
);

let initialized = false;

export function initMapbox() {
  if (initialized) return;
  if (!isMapboxNativeAvailable) {
    console.warn(
      '[mapbox] Native module not available (likely running in Expo Go). Globe will render a placeholder.',
    );
    return;
  }
  if (!MAPBOX_PUBLIC_TOKEN) {
    console.warn(
      '[mapbox] EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN is not set — the globe view will not render.',
    );
    return;
  }
  try {
    Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);
    initialized = true;
  } catch (err) {
    console.warn('[mapbox] Failed to initialize:', err);
  }
}
