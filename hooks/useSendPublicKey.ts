import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import ProtocolService from "@/lib/services/ProtocolService";
import { publicKeyState } from "@/lib/state/auth";
import { useAtom } from "jotai";
import { toast } from "@backpackapp-io/react-native-toast";

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
      if (!isCached) {
        await api.sendPublicKey(userId, identityKeyPair.publicKey);
      }

      toast.dismiss("sending-public-key");

      setPublicKey(identityKeyPair.publicKey);
    },
  });

  return { sendPublicKey, isPending, isSuccess };
}
