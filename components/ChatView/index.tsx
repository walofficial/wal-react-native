import Chat from "@/components/Chat";
import { useQuery } from "@tanstack/react-query";
import { Match, UserVerification } from "@/lib/interfaces";
import api from "@/lib/api";
import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { Alert, useColorScheme, View } from "react-native";
import { Text } from "@/components/ui/text";
import { verificationRefetchIntervalState } from "@/lib/state/chat";
import { useAtom, useSetAtom } from "jotai";
import useUserChat from "@/hooks/useUserChat";

import { verificationStatusState } from "@/components/VerificationStatusView/atom";
import { useLocalSearchParams, usePathname } from "expo-router";
import useAuth from "@/hooks/useAuth";
import { SheetManager } from "react-native-actions-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ChatView() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();

  const { match, isFetching } = useUserChat(matchId, true);
  const [refetchInterval, setRefetchInterval] = useAtom<number | undefined>(
    verificationRefetchIntervalState
  );

  const pathname = usePathname();

  const rejectionAlertMapRef = useRef(new Map<string, number>());

  useEffect(() => {
    return () => {
      (async () => {
        await AsyncStorage.removeItem(`lastRecordedVideoPath_${matchId}`);
      })();
    };
  }, [matchId]);

  const {
    data: verified,
    isSuccess,
    refetch,
    error,
    isError,
  } = useQuery<UserVerification | null>({
    queryKey: ["user-verification", matchId, user.id],
    queryFn: () => {
      return api.getUserVerification(matchId, user.id);
    },
    enabled: !!refetchInterval && pathname.includes("/chat/"),
    refetchIntervalInBackground: false,
    refetchInterval,
    retry: false,
  });

  useEffect(() => {
    if (refetchInterval) {
      refetch();
    }
  }, [refetchInterval]);

  const setStatus = useSetAtom(verificationStatusState);

  useEffect(() => {
    if (verified) {
      if (
        verified.state === "READY_FOR_USE" ||
        verified.state === "PROCESSING_MEDIA" ||
        verified.state === "PROCESSING_FAILED"
      ) {
        setStatus({
          status: "verification-success",
          text: "ვერიფიცირდა",
        });
        setRefetchInterval(undefined);
        (async () => {
          await queryClient.invalidateQueries({
            queryKey: ["user-chat", matchId],
          });
          const updatedMatch = await queryClient.getQueryData<Match>([
            "user-chat",
            matchId,
          ]);
          if (!updatedMatch?.task_completer_user_ids.includes(user.id)) {
            requestAnimationFrame(() => {
              SheetManager.show("user-make-it-public-sheet", {
                payload: {
                  userId: user.id,
                  matchId: matchId,
                },
              });
            });
          }
        })();

        (async () => {
          await AsyncStorage.removeItem("lastRecordedVideoPath");
        })();
      } else if (verified.state === "VERIFICATION_IN_PROGRESS") {
        setStatus({
          status: "verification-pending",
          text: "ვერიფიცირდება...",
        });
      } else if (verified.state === "VERIFICATION_FAILED") {
        setStatus({
          status: "verification-failed",
          text:
            verified.verification_trials?.[
              verified.verification_trials.length - 1
            ]?.rejection_description || "ვერიფიკაცია ვერ მოხერხდა",
        });

        const verificationId = verified.id;
        const trialsLength = verified.verification_trials?.length || 0;
        // 0 IS IMPORTANT HERE
        const lastShownTrialsLength =
          rejectionAlertMapRef.current.get(verificationId) || 0;
        if (
          lastShownTrialsLength === undefined ||
          lastShownTrialsLength !== trialsLength
        ) {
          rejectionAlertMapRef.current.set(verificationId, trialsLength);

          Alert.alert(
            "ვერიფიკაცია ვერ მოხერხდა",
            verified.verification_trials?.[
              verified.verification_trials.length - 1
            ]?.rejection_description || "ვერიფიკაცია ვერ მოხერხდა",
            [
              {
                text: "თავიდან ცდა",
              },
            ],
            {
              cancelable: true,
              userInterfaceStyle: "dark",
            }
          );
        }

        setRefetchInterval(undefined);
      }
    } else {
      setStatus(null);
    }
  }, [isSuccess, verified, match]);

  if (!match) {
    return (
      <View>
        <Text>chat-not-found</Text>
      </View>
    );
  }
  const userHasVerified =
    match?.task_completer_user_ids?.includes(user.id) || false;
  const matchUserHasVerified = match?.task_completer_user_ids.includes(
    match.target_user.id
  );
  return (
    <>
      <Chat
        canText={!!matchUserHasVerified && !!userHasVerified}
        isMobile={true}
        selectedUser={match.target_user}
      />
    </>
  );
}
