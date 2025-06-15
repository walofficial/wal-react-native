import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { User } from "../interfaces";
import { useSetAtom } from "jotai";
import { displayedContactsAtom } from "@/components/ContactSyncSheet/atom";
import { toast } from "@backpackapp-io/react-native-toast";

export const useFriendRequest = () => {
  const queryClient = useQueryClient();
  const setDisplayedContacts = useSetAtom(displayedContactsAtom);

  return useMutation({
    onMutate: () => {
      // toast.success("მოთხოვნა გაიგზავნა");
    },
    mutationFn: (userId: string) => api.sendFriendRequest(userId),
    onSuccess: (data, variables) => {
      if (data.error_code) {
        if (data.error_code === "ALREADY_SENT") {
          toast.error("მოთხოვნა უკვე გაგზავნილია");
        }
      }
      // Invalidate and refetch friend requests
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      // Remove the user from registeredContacts
      setDisplayedContacts((oldData: User[]) => {
        return oldData.filter((contact: User) => contact.id !== variables);
      });
    },
  });
};
