import type { LocationRegion } from 'expo-location';

/**
 * Geofencing task name - must be unique and consistent
 */
export const GEOFENCING_TASK_NAME = 'wal-geofencing-task';

/**
 * Geofencing event types for backend
 */
export type GeofenceEventType = 'enter' | 'exit';

/**
 * Extended region type with additional metadata
 */
export interface GeofencedRegion extends LocationRegion {
  name: string;
  description?: string;
}
