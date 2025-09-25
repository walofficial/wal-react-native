import MessageConnectionWrapper from '../Chat/socket/MessageConnectionWrapper';
import { useAtomValue } from 'jotai';
import { publicKeyState } from '@/lib/state/auth';
import { isWeb } from '@/lib/platform';
import { useNotificationHandler } from './useNotficationHandler';
import { useEffect, useState } from 'react';
import { getDeviceId } from '@/lib/device-id';

function DbUserGetter({
  children,
  showMessagePreview,
}: {
  children: React.ReactNode;
  showMessagePreview: boolean;
}) {
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const publicKey = useAtomValue(publicKeyState);

  if (isWeb) {
    return children;
  }

  if (!deviceId) {
    return null;
  }

  return (
    <MessageConnectionWrapper
      deviceId={deviceId}
      publicKey={publicKey}
      showMessagePreview={showMessagePreview}
    >
      {children}
    </MessageConnectionWrapper>
  );
}

export default DbUserGetter;
