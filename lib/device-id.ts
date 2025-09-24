import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'ment_device_id';

export async function getDeviceId(): Promise<string> {
  // Use stored value if available
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  // Try best-effort platform identifiers (non-stable across reinstalls, so we persist our own)
  let candidate = '';
  try {
    candidate = Application.getAndroidId() || '';
  } catch {}
  if (!candidate && Platform.OS === 'ios') {
    try {
      candidate = (await Application.getIosIdForVendorAsync()) || '';
    } catch {}
  }
  if (!candidate) {
    try {
      candidate = Device.osBuildId || '';
    } catch {}
  }

  const deviceId = candidate || uuidv4();
  await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export async function resetDeviceId(): Promise<void> {
  await AsyncStorage.removeItem(DEVICE_ID_KEY);
}


