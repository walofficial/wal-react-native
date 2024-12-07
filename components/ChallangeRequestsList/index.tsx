import React, { useCallback } from "react";
import {
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { H3, H4, P } from "@/components/ui/typography";
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import useChallangeUser from "@/hooks/useChallangeUser";
import { ChallangeRequest } from "@/lib/interfaces/index";
import UserAvatarLayout from "../UserAvatar";
import { useMyChallangeRequests } from "@/hooks/useMyChallangeRequests";
import { Text } from "@/components/ui/text";
function ChallangeRequestItem({
  isAccepting,
  isRejecting,
  item,
  onAccept,
  onReject,
}: {
  isAccepting: boolean;
  isRejecting: boolean;
  item: ChallangeRequest;
  onAccept: (userId: string) => void;
  onReject: (challengeId: string) => void;
}) {
  return (
    <View className="flex flex-1 flex-wrap my-2 border-b border-gray-700 pb-3  justify-between items-center w-full p-2 rounded-lg ">
      <View className="flex flex-row items-center">
        <UserAvatarLayout size="md">
          <AvatarImage
            className="rounded-full"
            source={{ uri: item.user.photos[0].image_url[0] }}
          />
          <AvatarFallback>
            <P>{item.user.username || "[deleted]"}</P>
          </AvatarFallback>
        </UserAvatarLayout>
        <View className="ml-3 flex-1">
          <Text numberOfLines={1}>{item.user.username || "[deleted]"}</Text>
          <Text
            className="text-gray-400"
            ellipsizeMode="tail"
            numberOfLines={1}
          >
            {item.task.display_name}
          </Text>
        </View>
      </View>
      <View className="flex flex-row mt-5 justify-center items-center">
        <Pressable
          disabled={isAccepting}
          className="bg-pink-600 px-3 py-2 rounded-lg mr-2"
          onPress={() => onAccept(item.challenge_id)}
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <P className="text-white text-lg">თანხმობა</P>
          )}
        </Pressable>
        <Pressable
          disabled={isRejecting}
          className="px-3 py-2 rounded-lg"
          onPress={() => onReject(item.challenge_id)}
        >
          {isRejecting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <P className="text-white">ვერა</P>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function ChallangeRequestsList() {
  const queryClient = useQueryClient();

  const { challangeRequests, isFetching, isRefetching, refetch } =
    useMyChallangeRequests();

  const { acceptChallange, rejectChallangeFromUser } = useChallangeUser();

  const handleAccept = (challengeId: string) => {
    acceptChallange.mutate(challengeId);
  };

  const handleReject = (challengeId: string) => {
    rejectChallangeFromUser.mutate({ challenge_id: challengeId, task_id: "" });
  };

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["my-challanges"],
    });
    refetch();
  }, [queryClient, refetch]);

  function renderList() {
    return challangeRequests?.map((item) => (
      <ChallangeRequestItem
        key={item.challenge_id}
        isAccepting={
          acceptChallange.isPending &&
          acceptChallange.variables === item.challenge_id
        }
        isRejecting={
          rejectChallangeFromUser.isPending &&
          rejectChallangeFromUser.variables.challenge_id === item.challenge_id
        }
        item={item}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    ));
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="px-3 pt-2"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
      >
        {isFetching && !isRefetching ? null : renderList()}
        {!challangeRequests?.length && (
          <Text className="text-center mt-2">არ მოიძებნა</Text>
        )}
      </ScrollView>
    </View>
  );
}
