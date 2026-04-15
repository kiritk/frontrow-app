// Dynamic Expo config that extends app.json and injects the Mapbox
// download-token secret from the MAPBOX_DOWNLOAD_TOKEN env var.
// See .env.example for the required variables.
//
// This is exported as a function (rather than a plain object) so that
// Expo's `modifyConfigAsync` flow can still write updates (e.g. the
// ITSAppUsesNonExemptEncryption declaration during `eas submit`) to
// the underlying static config at app.json.

// Only wire up the Mapbox plugin when the package is actually installed.
// That way `npx expo start` / `npm start` works on a fresh clone without
// requiring the Mapbox SDK — useful for testing non-map UI locally.
let mapboxPlugin = null;
try {
  require.resolve('@rnmapbox/maps');
  mapboxPlugin = [
    '@rnmapbox/maps',
    {
      RNMapboxMapsImpl: 'mapbox',
      RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN,
    },
  ];
} catch (e) {
  console.warn('[app.config] @rnmapbox/maps not installed — skipping plugin. Run `npm install` to enable the globe.');
}

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    ...(mapboxPlugin ? [mapboxPlugin] : []),
  ],
});
