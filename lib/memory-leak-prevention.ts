/**
 * Memory Leak Prevention Utilities for React Native
 *
 * This file contains utilities and best practices to prevent memory leaks
 * in React Native applications, particularly with React Query, animations,
 * timers, and event listeners.
 */

import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { cancelAnimation } from 'react-native-reanimated';

/**
 * Hook to safely manage timers and prevent memory leaks
 */
export function useSafeTimer() {
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const isMountedRef = useRef(true);

  const setTimeout = (callback: () => void, delay: number): NodeJS.Timeout => {
    const timer = global.setTimeout(() => {
      if (isMountedRef.current) {
        callback();
      }
      timersRef.current.delete(timer);
    }, delay);

    timersRef.current.add(timer);
    return timer;
  };

  const setInterval = (callback: () => void, delay: number): NodeJS.Timeout => {
    const interval = global.setInterval(() => {
      if (isMountedRef.current) {
        callback();
      } else {
        clearInterval(interval);
      }
    }, delay);

    timersRef.current.add(interval);
    return interval;
  };

  const clearTimeout = (timer: NodeJS.Timeout) => {
    global.clearTimeout(timer);
    timersRef.current.delete(timer);
  };

  const clearInterval = (interval: NodeJS.Timeout) => {
    global.clearInterval(interval);
    timersRef.current.delete(interval);
  };

  const clearAllTimers = () => {
    timersRef.current.forEach((timer) => {
      global.clearTimeout(timer);
      global.clearInterval(timer);
    });
    timersRef.current.clear();
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearAllTimers();
    };
  }, []);

  return {
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
    clearAllTimers,
    isMounted: () => isMountedRef.current,
  };
}

/**
 * Hook to safely manage animations and prevent memory leaks
 */
export function useSafeAnimation() {
  const animationsRef = useRef<Set<any>>(new Set());
  const isMountedRef = useRef(true);

  const registerAnimation = (sharedValue: any) => {
    animationsRef.current.add(sharedValue);
  };

  const cancelAllAnimations = () => {
    animationsRef.current.forEach((sharedValue) => {
      try {
        cancelAnimation(sharedValue);
      } catch (error) {
        // Silently fail if animation is already cancelled
      }
    });
    animationsRef.current.clear();
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cancelAllAnimations();
    };
  }, []);

  return {
    registerAnimation,
    cancelAllAnimations,
    isMounted: () => isMountedRef.current,
  };
}

/**
 * Hook to safely manage event listeners
 */
export function useSafeEventListeners() {
  const listenersRef = useRef<Set<{ remove: () => void }>>(new Set());
  const isMountedRef = useRef(true);

  const addListener = (listener: { remove: () => void }) => {
    listenersRef.current.add(listener);
    return listener;
  };

  const removeListener = (listener: { remove: () => void }) => {
    try {
      listener.remove();
    } catch (error) {
      // Silently fail if listener is already removed
    }
    listenersRef.current.delete(listener);
  };

  const removeAllListeners = () => {
    listenersRef.current.forEach((listener) => {
      try {
        listener.remove();
      } catch (error) {
        // Silently fail if listener is already removed
      }
    });
    listenersRef.current.clear();
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      removeAllListeners();
    };
  }, []);

  return {
    addListener,
    removeListener,
    removeAllListeners,
    isMounted: () => isMountedRef.current,
  };
}

/**
 * Safe refetch interval that respects component mounting and app state
 */
export function useSafeRefetchInterval(
  intervalMs: number,
  dependencies: any[] = [],
): number | false {
  const isMountedRef = useRef(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const listener = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;
    });

    return () => {
      listener.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Return false if component is unmounted or app is in background
  const shouldRefetch =
    isMountedRef.current && appStateRef.current === 'active';

  return shouldRefetch ? intervalMs : false;
}

/**
 * Query options with memory leak prevention
 */
export const createSafeQueryOptions = (isFocused: boolean) => ({
  // Memory leak prevention settings
  gcTime: 1000 * 60 * 2, // 2 minutes - more aggressive garbage collection
  staleTime: 1000 * 30, // 30 seconds - data stays fresh for 30s

  // Prevent background refetching
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchIntervalInBackground: false,

  // Only enable when focused
  enabled: isFocused,
  subscribed: isFocused,

  // Reduce retry attempts
  retry: 1,
  retryDelay: 1000,
});

/**
 * Safe refetch interval for queries that respects focus and app state
 */
export function createSafeRefetchInterval(
  baseInterval: number,
  isFocused: boolean,
): number | false {
  const [appState, setAppState] = React.useState(AppState.currentState);

  React.useEffect(() => {
    const listener = AppState.addEventListener('change', setAppState);
    return () => listener.remove();
  }, []);

  return isFocused && appState === 'active' ? baseInterval : false;
}

/**
 * Memory leak prevention best practices checklist:
 *
 * 1. ✅ Always clear timers in useEffect cleanup
 * 2. ✅ Cancel animations on component unmount
 * 3. ✅ Remove event listeners properly
 * 4. ✅ Use aggressive garbage collection for queries
 * 5. ✅ Avoid continuous background refetching
 * 6. ✅ Check isMounted before state updates
 * 7. ✅ Clear refs on unmount
 * 8. ✅ Avoid memory-heavy placeholderData
 * 9. ✅ Use focus-based query enabling
 * 10. ✅ Monitor AppState for background intervals
 */

export const MEMORY_LEAK_PREVENTION_NOTES = `
Common Memory Leak Sources in React Native:

1. Timers (setTimeout, setInterval) not cleared
2. Event listeners not removed
3. React Query with continuous refetchInterval
4. Reanimated shared values not cancelled
5. WebSocket connections not closed
6. Image caches not cleared
7. Navigation listeners not removed
8. AsyncStorage operations not cancelled
9. Network requests not aborted
10. Background tasks not stopped

Prevention Strategies:

1. Always use cleanup functions in useEffect
2. Track component mounting state with refs
3. Use conditional intervals based on app focus
4. Clear all resources on unmount
5. Monitor memory usage in development
6. Use React DevTools Profiler
7. Test app backgrounding/foregrounding
8. Implement proper error boundaries
9. Use lazy loading for heavy components
10. Regular memory profiling
`;
