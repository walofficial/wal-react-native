import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { getApiBaseUrl } from '@/lib/api/config';
import { supabase } from '@/lib/supabase';

import { GEOFENCING_TASK_NAME } from './constants';

/**
 * Payload sent to backend when geofence event occurs
 */
interface GeofenceEventPayload {
  event_type: 'enter' | 'exit';
  region_identifier: string;
  region_name: string;
  latitude: number;
  longitude: number;
  radius: number;
  timestamp: string;
}

/**
 * Send geofence event to the backend
 */
async function sendGeofenceEventToBackend(
  payload: GeofenceEventPayload,
): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      console.warn('[Geofencing] No auth token available, skipping API call');
      return;
    }

    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/geofence/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        '[Geofencing] Failed to send event to backend:',
        response.status,
      );
    } else {
      console.log('[Geofencing] Event sent successfully:', payload.event_type);
    }
  } catch (error) {
    console.error('[Geofencing] Error sending event to backend:', error);
  }
}

/**
 * Define the geofencing background task
 * This MUST be called at the module level (outside of React components)
 * so that the task is registered when the app starts
 */
TaskManager.defineTask(
  GEOFENCING_TASK_NAME,
  async ({
    data,
    error,
  }: {
    data?: {
      eventType: Location.GeofencingEventType;
      region: Location.LocationRegion;
    };
    error?: TaskManager.TaskManagerError | null;
  }) => {
    if (error) {
      console.error('[Geofencing] Task error:', error.message);
      return;
    }

    if (!data) {
      console.warn('[Geofencing] No data received in task');
      return;
    }

    const { eventType, region } = data;

    // Use region identifier as the name (set when geofencing was started)
    const regionName = region.identifier ?? 'Unknown';

    const eventTypeName =
      eventType === Location.GeofencingEventType.Enter ? 'enter' : 'exit';

    console.log(`[Geofencing] ${eventTypeName.toUpperCase()}: ${regionName}`);
    console.log('[Geofencing] Region details:', {
      identifier: region.identifier,
      latitude: region.latitude,
      longitude: region.longitude,
      radius: region.radius,
    });

    // Prepare payload for backend
    const payload: GeofenceEventPayload = {
      event_type: eventTypeName,
      region_identifier: region.identifier ?? 'unknown',
      region_name: regionName,
      latitude: region.latitude,
      longitude: region.longitude,
      radius: region.radius,
      timestamp: new Date().toISOString(),
    };

    // Send to backend
    await sendGeofenceEventToBackend(payload);
  },
);

export { GEOFENCING_TASK_NAME };
