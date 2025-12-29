import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Import geofencing task to register it at app startup
// This must be imported before the app renders
// import './lib/geofencing/geofenceTask';

// https://docs.expo.dev/router/reference/troubleshooting/#expo_router_app_root-not-defined

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
