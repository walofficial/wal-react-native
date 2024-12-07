import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

export default function useSendPublicKey() {
  const {
    mutate: sendPublicKey,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: async ({
      userId,
      publicKey,
    }: {
      userId: string;
      publicKey: string;
    }) => {
      await api.sendPublicKey(userId, publicKey);
    },
  });

  return { sendPublicKey, isPending, isSuccess };
}
