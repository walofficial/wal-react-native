import { Platform } from 'react-native';

type AnalyticsModule = {
  (): any;
};

function getAnalyticsInstance() {
  if (Platform.OS === 'web') return null;
  try {
    const rnfbAnalytics: AnalyticsModule =
      require('@react-native-firebase/analytics').default;
    return rnfbAnalytics();
  } catch (_e) {
    return null;
  }
}

function sanitizeParams(params?: Record<string, unknown>) {
  if (!params) return undefined;
  const sanitized: Record<string, string | number | boolean | null> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      sanitized[key] = value as any;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.length;
    } else if (value && typeof value === 'object') {
      // Avoid nested objects: send a JSON length marker
      sanitized[key] = Object.keys(value as object).length;
    }
  });
  return sanitized;
}

export async function trackEvent(
  name: string,
  params?: Record<string, unknown>,
) {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;
  try {
    await analytics.logEvent(name, sanitizeParams(params));
  } catch (_e) {
    // no-op
  }
}

export async function trackScreen(screenName: string, screenClass?: string) {
  return trackEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
}

export async function setUserId(userId?: string | null) {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;
  try {
    await analytics.setUserId(userId || null);
  } catch (_e) {
    // no-op
  }
}

export async function setUserProperties(
  props: Record<string, string | number | boolean>,
) {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;
  try {
    await analytics.setUserProperties(props as any);
  } catch (_e) {
    // no-op
  }
}

export async function setAnalyticsCollectionEnabled(enabled: boolean) {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;
  try {
    await analytics.setAnalyticsCollectionEnabled(enabled);
  } catch (_e) {
    // no-op
  }
}

export async function setConsent(consent: {
  analytics_storage?: boolean;
  ad_storage?: boolean;
  ad_user_data?: boolean;
  ad_personalization?: boolean;
}) {
  const analytics = getAnalyticsInstance();
  if (!analytics) return;
  try {
    await analytics.setConsent(consent);
  } catch (_e) {
    // no-op
  }
}
