// Export constants and types
export {
  GEOFENCING_TASK_NAME,
  type GeofencedRegion,
  type GeofenceEventType,
} from './constants';

// Export geofence service
export {
  hasGeofencingStarted,
  requestGeofencingPermissions,
  startGeofencing,
  stopGeofencing,
} from './geofenceService';

// Import the task definition to ensure it's registered
import './geofenceTask';

