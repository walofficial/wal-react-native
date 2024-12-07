import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { UserAvatarChallangeSkeleton } from "../UserAvatarChallange";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import useChallangeUser from "@/hooks/useChallangeUser";
import * as Progress from "react-native-progress";
import { useGlobalSearchParams } from "expo-router";
import { taskIdInViewAtom } from "../UserSelectedTask/atom";
import { useAtomValue } from "jotai";
import { SheetManager } from "react-native-actions-sheet";
import { Button } from "../ui/button";
import UserAvatarLayout from "../UserAvatar";
import { Skeleton } from "../ui/skeleton";
import UserAvatarChallange from "../UserAvatarChallange";

const MAX_ITEMS = 50;

const HorizontalFriendsList: React.FC<{ taskId: string }> = ({ taskId }) => {
  const { data, isFetching, isLoading } = useInfiniteQuery({
    queryKey: ["friends"],
    queryFn: () => api.getFriendsList(1, MAX_ITEMS),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const nextPage = pages.length + 1;
      return lastPage.length === MAX_ITEMS ? nextPage : undefined;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { challangeUser } = useChallangeUser();

  const [progress, setProgress] = useState(0);
  const [challengingFriendId, setChallengingFriendId] = useState<string | null>(
    null
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (challangeUser.isPending && challengingFriendId) {
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 1) {
            clearInterval(interval);
            return 1;
          }
          return prevProgress + 0.05;
        });
      }, 50);
    } else {
      setProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [challangeUser.isPending, challengingFriendId]);
  return (
    <View>
      <Text className="text-lg font-semibold text-white mb-3">მეგობრები</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {isFetching ? (
          <UserAvatarChallangeSkeleton size="lg" />
        ) : (
          data?.pages
            .flatMap((page) => page)
            .map((item, index) => (
              <TouchableOpacity
                className={cn("ml-2", index === 0 ? "ml-0" : "")}
                key={item.id}
                onPress={() => {
                  setChallengingFriendId(item.id);
                  challangeUser.mutate({
                    userId: item.id,
                    taskId,
                  });
                }}
              >
                <View className="relative p-0">
                  <UserAvatarChallange
                    size="lg"
                    isLoading={
                      challangeUser.isPending &&
                      challangeUser.variables.userId === item.id
                    }
                    isSuccess={
                      challangeUser.isSuccess &&
                      challangeUser.variables.userId === item.id
                    }
                    user={item}
                  />
                </View>
              </TouchableOpacity>
            ))
        )}
        {!isFetching && data?.pages.flatMap((page) => page).length === 0 && (
          <TouchableOpacity
            onPress={() => {
              SheetManager.show("contact-sync-sheet");
            }}
          >
            <UserAvatarLayout size="lg" borderColor={"gray"}>
              <Ionicons name="person-add-outline" size={32} color="white" />
            </UserAvatarLayout>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

export default HorizontalFriendsList;
