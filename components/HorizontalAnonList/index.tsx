import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import useChallangeUser from "@/hooks/useChallangeUser";
import { useQueryClient } from "@tanstack/react-query";
import { taskIdInViewAtom } from "../UserSelectedTask/atom";
import { useAtom, useAtomValue } from "jotai";
import { toast } from "@backpackapp-io/react-native-toast";
import ChallangeToggle from "@/components/ChallangeToggle";
import UserLiveItem from "@/components/UserLiveItem";
import useLiveUser from "@/hooks/useLiveUser";
import useAuth from "@/hooks/useAuth";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";

const MAX_ITEMS = 30;
const COLUMNS = 4;

const HorizontalAnonList: React.FC<{ taskId: string }> = ({ taskId }) => {
  const { data, isFetching } = useInfiniteQuery({
    enabled: !!taskId,
    queryKey: ["anon-list", taskId],
    queryFn: () => api.getAnonListForTask(taskId),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const nextPage = pages.length + 1;
      return lastPage.length === MAX_ITEMS ? nextPage : undefined;
    },
    refetchOnMount: false,
    staleTime: 5000,
    refetchInterval: 3000,
  });

  const { user } = useAuth();

  const { joinChat } = useLiveUser();
  const items =
    data?.pages
      .flatMap((page) => page)
      .slice(0, MAX_ITEMS)
      .sort((a, b) =>
        a.user.id === user.id ? -1 : b.user.id === user.id ? 1 : 0
      ) ?? [];

  return (
    <View className="flex">
      <BottomSheetScrollView showsHorizontalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify py-2">
          {items.map((item, index) => (
            <TouchableOpacity
              className="mb-6 border-2"
              style={{
                width: Dimensions.get("window").width / COLUMNS - 5,
              }}
              key={item.user.id}
              onPress={() => {
                if (item.user.id === user.id) return;
                requestAnimationFrame(() => {
                  joinChat.mutate({
                    targetUserId: item.user.id,
                  });
                });
              }}
            >
              <UserLiveItem
                showName={item.user.id !== user.id}
                size="md"
                color={
                  item.user.id === user.id
                    ? "gray"
                    : item.is_friend
                    ? "green"
                    : "pink"
                }
                isLoading={
                  joinChat.isPending &&
                  joinChat.variables.targetUserId === item.user.id
                }
                isSuccess={
                  joinChat.isSuccess &&
                  joinChat.variables.targetUserId === item.user.id
                }
                user={item.user}
              />
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetScrollView>
    </View>
  );
};

const AnonAvatarContainer: React.FC = () => {
  const taskIdInView = useAtomValue(taskIdInViewAtom);
  const queryClient = useQueryClient();

  const {
    data: userPublicChallange,
    isRefetching,
    isFetching,
  } = useQuery({
    queryKey: ["isChallengingThisTask", taskIdInView],
    queryFn: () => api.isChallengingThisTask(taskIdInView as string),
    refetchOnWindowFocus: false,
    refetchInterval: 5000,
  });

  const { makePublicChallange, rejectChallangeFromUser } = useChallangeUser();

  const toggleChallenge = () => {
    if (
      userPublicChallange?.is_public_disabled &&
      !userPublicChallange?.is_challenging
    ) {
      toast("3 ზე მეტ დავალებაზე ვერ გამოჩნდებით", {
        id: "anon-list-warning",
      });
      return;
    }
    const isChallengingNow = userPublicChallange?.is_challenging;

    // Optimistic update
    queryClient.setQueryData(["isChallengingThisTask", taskIdInView], {
      is_challenging: !isChallengingNow,
    });

    if (!isChallengingNow) {
      makePublicChallange.mutate(taskIdInView as string, {
        onError: () => {
          queryClient.setQueryData(["isChallengingThisTask", taskIdInView], {
            is_challenging: false,
          });
        },
      });
    } else {
      rejectChallangeFromUser.mutate(
        {
          challenge_id: (userPublicChallange as any).challenge_id as string,
          task_id: taskIdInView as string,
        },
        {
          onError: () => {
            queryClient.setQueryData(["isChallengingThisTask", taskIdInView], {
              is_challenging: true,
            });
          },
        }
      );
    }
  };

  const disabled =
    isFetching ||
    makePublicChallange.isPending ||
    rejectChallangeFromUser.isPending;

  const isChallenging = userPublicChallange?.is_challenging;
  const isPublicDisabled = userPublicChallange?.is_public_disabled;

  return (
    <ChallangeToggle
      disabled={disabled}
      isChallenging={isChallenging}
      isPublicDisabled={isPublicDisabled}
      onPress={toggleChallenge}
    />
  );
};

export default HorizontalAnonList;
