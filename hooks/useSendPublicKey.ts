import { useMutation } from '@tanstack/react-query';
import ProtocolService from '@/lib/services/ProtocolService';
import { publicKeyState } from '@/lib/state/auth';
import { useAtom } from 'jotai';
import { sendPublicKeyChatSendPublicKeyPost } from '@/lib/api/generated';
import { getDeviceId } from '../lib/device-id';
// dynamic import inside mutation to avoid type resolution before file is ready

export default function useSendPublicKey() {
  const [_, setPublicKey] = useAtom(publicKeyState);
  const {
    mutate: sendPublicKey,
    isPending,
    isSuccess,
  } = useMutation({
  mutationFn: async ({ userId, deviceId: providedDeviceId }: { userId: string; deviceId?: string }) => {
      const { identityKeyPair, isCached } =
        await ProtocolService.generateIdentityKeyPair();

      if (isCached) {
        // Avoid resetting the timestamp of the public key and setting new public key
        setPublicKey(identityKeyPair.publicKey);
        return;
      }

      const deviceId = providedDeviceId || (await getDeviceId());
      await sendPublicKeyChatSendPublicKeyPost({
        body: {
          user_id: userId,
          public_key: identityKeyPair.publicKey,
          // @ts-ignore - extend request with device_id until openapi is updated
          device_id: deviceId,
        },
      });

      setPublicKey(identityKeyPair.publicKey);
    },
  });

  return { sendPublicKey, isPending, isSuccess };
}
