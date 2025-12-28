import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { GEOFENCING_TASK_NAME, type GeofencedRegion } from './constants';

/**
 * Request necessary permissions for geofencing
 * Returns true if all permissions are granted
 */
export async function requestGeofencingPermissions(): Promise<boolean> {
  try {
    // First request foreground location permission
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      console.warn(
        '[Geofencing] Foreground location permission not granted:',
        foregroundStatus,
      );
      return false;
    }

    // Then request background location permission
    // Note: On iOS, this will show a separate prompt
    // On Android 10+, this requires a separate dialog
    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();

    if (backgroundStatus !== 'granted') {
      console.warn(
        '[Geofencing] Background location permission not granted:',
        backgroundStatus,
      );
      // Still return true for foreground-only usage on some platforms
      // Geofencing may work with limited functionality
      if (Platform.OS === 'ios') {
        console.log(
          '[Geofencing] iOS may still support geofencing with "When In Use" permission',
        );
        return true;
      }
      return false;
    }

    console.log('[Geofencing] All location permissions granted');
    return true;
  } catch (error) {
    console.error('[Geofencing] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Check if geofencing task is already started
 */
export async function hasGeofencingStarted(): Promise<boolean> {
  try {
    return await Location.hasStartedGeofencingAsync(GEOFENCING_TASK_NAME);
  } catch (error) {
    console.error('[Geofencing] Error checking geofencing status:', error);
    return false;
  }
}

/**
 * Start geofencing for provided regions
 * Requires permissions to be granted first
 * @param dynamicRegions - Array of regions to monitor. If empty, geofencing will be stopped.
 */
export async function startGeofencing(
  dynamicRegions: GeofencedRegion[] = [],
): Promise<boolean> {
  try {
    // Check if task is defined
    const isTaskDefined = TaskManager.isTaskDefined(GEOFENCING_TASK_NAME);
    if (!isTaskDefined) {
      console.error(
        '[Geofencing] Task is not defined. Make sure to import geofenceTask module.',
      );
      return false;
    }

    // If no regions provided, stop geofencing
    if (dynamicRegions.length === 0) {
      console.log('[Geofencing] No regions provided, stopping geofencing...');
      return await stopGeofencing();
    }

    // Check if already running
    const isRunning = await hasGeofencingStarted();
    if (isRunning) {
      console.log('[Geofencing] Already running, updating regions...');
      // Stop first to ensure clean restart with new regions
      await stopGeofencing();
    }

    // Convert our extended regions to LocationRegion format
    const regions: Location.LocationRegion[] = dynamicRegions.map((region) => ({
      identifier: region.identifier,
      latitude: region.latitude,
      longitude: region.longitude,
      radius: region.radius,
      notifyOnEnter: region.notifyOnEnter ?? true,
      notifyOnExit: region.notifyOnExit ?? true,
    }));

    // Start geofencing
    await Location.startGeofencingAsync(GEOFENCING_TASK_NAME, regions);

    console.log(
      `[Geofencing] Started monitoring ${regions.length} regions:`,
      regions.map((r) => r.identifier).join(', '),
    );

    return true;
  } catch (error) {
    console.error('[Geofencing] Error starting geofencing:', error);
    return false;
  }
}

/**
 * Stop geofencing and unregister the task
 */
export async function stopGeofencing(): Promise<boolean> {
  try {
    const isRunning = await hasGeofencingStarted();
    if (!isRunning) {
      console.log('[Geofencing] Not running, nothing to stop');
      return true;
    }

    await Location.stopGeofencingAsync(GEOFENCING_TASK_NAME);
    console.log('[Geofencing] Stopped monitoring all regions');

    return true;
  } catch (error) {
    console.error('[Geofencing] Error stopping geofencing:', error);
    return false;
  }
}
