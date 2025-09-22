import { useMutation } from '@tanstack/react-query';
import ProtocolService from '@/lib/services/ProtocolService';
import { publicKeyState } from '@/lib/state/auth';
import { useAtom } from 'jotai';
import { sendPublicKeyChatSendPublicKeyPost } from '@/lib/api/generated';

export default function useSendPublicKey() {
  const [_, setPublicKey] = useAtom(publicKeyState);
  const {
    mutate: sendPublicKey,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { identityKeyPair, isCached } =
        await ProtocolService.generateIdentityKeyPair();

      if (isCached) {
        // Avoid resetting the timestamp of the public key and setting new public key
        setPublicKey(identityKeyPair.publicKey);
        return;
      }

      await sendPublicKeyChatSendPublicKeyPost({
        body: {
          user_id: userId,
          public_key: identityKeyPair.publicKey,
        },
      });

      setPublicKey(identityKeyPair.publicKey);
    },
  });

  return { sendPublicKey, isPending, isSuccess };
}
