import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from './socket';
import { SocketContext } from './context';
import useAuth from '@/hooks/useAuth';
import { useAtomValue } from 'jotai';
import { publicKeyState } from '@/lib/state/auth';
import { getDeviceId } from '@/lib/device-id';

/**
 * A lightweight socket provider for use in pages outside the main MessageConnectionWrapper.
 * This is specifically for cases like the camera/mediapage where we need to emit
 * chat messages but don't need all the message receiving/handling logic.
 */
export default function ChatModeSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const publicKey = useAtomValue(publicKeyState);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Get device ID on mount
  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  // Initialize socket when we have all required data
  useEffect(() => {
    if (!user?.id || !publicKey || !deviceId) {
      return;
    }

    socketRef.current = getSocket(user.id, publicKey, deviceId);
    socketRef.current.connect();
    setIsReady(true);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, publicKey, deviceId]);

  // Wait until socket is ready
  if (!isReady || !socketRef.current) {
    return <>{children}</>;
  }

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}
