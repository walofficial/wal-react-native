import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import useChallangeUser from "@/hooks/useChallangeUser";
import { PublicChallenge } from "@/lib/interfaces";
import ChallangeToggle from "../ChallangeToggle";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ka } from "date-fns/locale";
import { Link, useRouter } from "expo-router";
import { Badge } from "../ui/badge";
import { Ionicons } from "@expo/vector-icons";
import { SheetManager } from "react-native-actions-sheet";

interface UserPublicChallangeItemProps {
  item: PublicChallenge;
}

const Countdown: React.FC<{ expirationDate: string }> = ({
  expirationDate,
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  //   console.log(formatDistanceToNow(parseISO(expirationDate), { locale: ka }));
  //   useEffect(() => {
  //     const timer = setInterval(() => {
  //       const now = new Date();
  //       const expiration = parseISO(expirationDate);
  //       const hours = differenceInHours(expiration, now);
  //       const minutes = differenceInMinutes(expiration, now) % 60;
  //       console.log(hours, minutes);
  //       if (hours > 0 || minutes > 0) {
  //         setTimeLeft(`${hours} საათი ${minutes} წუთი`);
  //       } else {
  //         setTimeLeft("დრო ამოიწურა");
  //         clearInterval(timer);
  //       }
  //     }, 1000);

  //     return () => clearInterval(timer);
  //   }, [expirationDate]);

  return (
    <Text className="text-white text-lg">
      დარჩა {formatDistanceToNow(parseISO(expirationDate), { locale: ka })}
    </Text>
  );
};

export default function UserPublicChallangeItem({
  item,
}: UserPublicChallangeItemProps) {
  const queryClient = useQueryClient();
  const { rejectChallangeFromUser, makePublicChallange } = useChallangeUser();
  const router = useRouter();

  const handleToggleChallenge = () => {
    // Optimistic update
    queryClient.setQueryData(
      ["public-challenges"],
      (oldData: PublicChallenge[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((challenge) =>
          challenge.challenge_id === item.challenge_id
            ? { ...challenge, is_challenging: !challenge.is_challenging }
            : challenge
        );
      }
    );

    if (item.is_challenging) {
      rejectChallangeFromUser.mutate(
        { challenge_id: item.challenge_id, task_id: item.task.id },
        {
          onError: () => {
            // Revert optimistic update on error
            queryClient.invalidateQueries({ queryKey: ["public-challenges"] });
          },
        }
      );
    } else {
      makePublicChallange.mutate(item.task.id, {
        onError: () => {
          // Revert optimistic update on error
          queryClient.invalidateQueries({ queryKey: ["public-challenges"] });
        },
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={() => {
        router.push({
          pathname: "/(tabs)/(explore)/task/[taskId]",
          params: {
            taskId: item.task.id,
          },
        });
        SheetManager.show("user-challange-options");
      }}
    >
      <View className="flex-row w-full justify-start items-center p-4 border-b border-gray-700 rounded-lg mb-2">
        <View className="flex-1">
          <Text className="text-white text-2xl font-semibold mb-1">
            {item.task.display_name}
          </Text>
          {/* <Countdown expirationDate={item.expiration_date} /> */}
          <Text className="text-white text-md">
            {item.task.task_location?.name}
          </Text>
          <View className="flex items-center flex-row mt-3">
            <Ionicons name="people" size={24} color="white" />
            <Text className="text-white ml-2 font-semibold text-md">
              {item.live_user_count || 0}
            </Text>
          </View>
        </View>
        <ChallangeToggle
          disabled={false}
          isChallenging={item.is_challenging}
          onPress={handleToggleChallenge}
        />
      </View>
    </TouchableOpacity>
  );
}
