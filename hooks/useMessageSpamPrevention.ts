import { useRef, useCallback } from 'react';

interface SpamPreventionConfig {
  timeoutMs: number; // Time window to check for spam
  maxMessages: number; // Max messages allowed in the time window
}

const DEFAULT_CONFIG: SpamPreventionConfig = {
  timeoutMs: 3000, // 3 seconds
  maxMessages: 5, // 5 messages max in 3 seconds
};

interface MessageTimestamp {
  senderId: string;
  timestamp: number;
}

export const useMessageSpamPrevention = (config: Partial<SpamPreventionConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const messageHistoryRef = useRef<Map<string, MessageTimestamp[]>>(new Map());

  const cleanupOldMessages = useCallback(() => {
    const now = Date.now();
    const cutoff = now - finalConfig.timeoutMs;

    messageHistoryRef.current.forEach((timestamps, senderId) => {
      const filtered = timestamps.filter(ts => ts.timestamp > cutoff);
      if (filtered.length === 0) {
        messageHistoryRef.current.delete(senderId);
      } else {
        messageHistoryRef.current.set(senderId, filtered);
      }
    });
  }, [finalConfig.timeoutMs]);

  const canShowMessagePreview = useCallback((senderId: string): boolean => {
    cleanupOldMessages();

    const senderHistory = messageHistoryRef.current.get(senderId) || [];
    const now = Date.now();
    const cutoff = now - finalConfig.timeoutMs;

    // Count messages in the current time window
    const recentMessages = senderHistory.filter(ts => ts.timestamp > cutoff);

    return recentMessages.length < finalConfig.maxMessages;
  }, [cleanupOldMessages, finalConfig.timeoutMs, finalConfig.maxMessages]);

  const recordMessage = useCallback((senderId: string) => {
    const now = Date.now();
    const senderHistory = messageHistoryRef.current.get(senderId) || [];

    senderHistory.push({ senderId, timestamp: now });
    messageHistoryRef.current.set(senderId, senderHistory);

    cleanupOldMessages();
  }, [cleanupOldMessages]);

  const getSenderTimeout = useCallback((senderId: string): number => {
    const senderHistory = messageHistoryRef.current.get(senderId) || [];
    if (senderHistory.length === 0) return 0;

    const oldestMessage = Math.min(...senderHistory.map(ts => ts.timestamp));
    const now = Date.now();
    const timeSinceOldest = now - oldestMessage;

    if (timeSinceOldest < finalConfig.timeoutMs) {
      return finalConfig.timeoutMs - timeSinceOldest;
    }

    return 0;
  }, [finalConfig.timeoutMs]);

  return {
    canShowMessagePreview,
    recordMessage,
    getSenderTimeout,
  };
};
