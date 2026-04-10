// Dynamic Expo config that extends app.json and injects the Mapbox
// download-token secret from the MAPBOX_DOWNLOAD_TOKEN env var.
// See .env.example for the required variables.
//
// This is exported as a function (rather than a plain object) so that
// Expo's `modifyConfigAsync` flow can still write updates (e.g. the
// ITSAppUsesNonExemptEncryption declaration during `eas submit`) to
// the underlying static config at app.json.
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsImpl: 'mapbox',
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN,
      },
    ],
  ],
});
