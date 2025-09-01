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
      const { identityKeyPair } =
        await ProtocolService.generateIdentityKeyPair();

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
