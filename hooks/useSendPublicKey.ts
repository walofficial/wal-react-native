import { useMutation } from "@tanstack/react-query";
import ProtocolService from "@/lib/services/ProtocolService";
import { publicKeyState } from "@/lib/state/auth";
import { useAtom } from "jotai";
import { toast } from "@backpackapp-io/react-native-toast";
import { sendPublicKeyChatSendPublicKeyPostMutation } from "@/lib/api/generated/@tanstack/react-query.gen";
import { sendPublicKeyChatSendPublicKeyPost } from "@/lib/api/generated";

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

      toast.dismiss("sending-public-key");
      setPublicKey(identityKeyPair.publicKey);
    },
  });

  return { sendPublicKey, isPending, isSuccess };
}
