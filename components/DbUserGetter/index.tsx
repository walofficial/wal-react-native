import MessageConnectionWrapper from '../Chat/socket/MessageConnectionWrapper';
import { useAtomValue } from 'jotai';
import { publicKeyState } from '@/lib/state/auth';
import { isWeb } from '@/lib/platform';
import { useNotificationHandler } from './useNotficationHandler';

function DbUserGetter({
  children,
  showMessagePreview,
}: {
  children: React.ReactNode;
  showMessagePreview: boolean;
}) {
  const publicKey = useAtomValue(publicKeyState);
  useNotificationHandler();

  if (isWeb) {
    return children;
  }
  return (
    <MessageConnectionWrapper
      publicKey={publicKey}
      showMessagePreview={showMessagePreview}
    >
      {children}
    </MessageConnectionWrapper>
  );
}

export default DbUserGetter;
