import { NativeModules } from 'react-native';

// Public Mapbox access token (starts with pk.)
// Set EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN in .env — see .env.example.
export const MAPBOX_PUBLIC_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN ?? '';

// True when the Mapbox native module is linked (i.e. a dev/prod build, not Expo Go).
// This file deliberately does NOT import @rnmapbox/maps — importing the JS
// package triggers native access at module-load time and crashes Expo Go.
export const isMapboxNativeAvailable = !!(
  (NativeModules as any).RNMBXModule || (NativeModules as any).MGLModule
);

let initialized = false;

// Must only be called from a module that's already known to be safe
// (i.e. EventsGlobeImpl.tsx, which is lazy-required when native is linked).
export function initMapbox() {
  if (initialized) return;
  if (!isMapboxNativeAvailable) return;
  if (!MAPBOX_PUBLIC_TOKEN) {
    console.warn(
      '[mapbox] EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN is not set — the globe view will not render.',
    );
    return;
  }
  try {
    // Lazy require so bundling EventsScreen (which imports isMapboxNativeAvailable)
    // doesn't pull @rnmapbox/maps into the Expo Go module graph.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Mapbox = require('@rnmapbox/maps').default;
    Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);
    initialized = true;
  } catch (err) {
    console.warn('[mapbox] Failed to initialize:', err);
  }
}
