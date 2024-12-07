import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAtom } from "jotai";
import { activeFeedAtom } from "../ExploreScene/atom";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { PublicChallenge } from "@/lib/interfaces";
import { Badge } from "../ui/badge";
import { Text } from "../ui/text";
export default function FeedSelector() {
  const [activeFeed, setActiveFeed] = useAtom(activeFeedAtom);
  const {
    data: publicChallenges,
    isLoading,
    refetch,
  } = useQuery<PublicChallenge[]>({
    queryKey: ["public-challenges"],
    queryFn: api.getPublicChallenges,
    refetchInterval: 5000,
  });

  const hasChallenges = publicChallenges && publicChallenges.length > 0;

  return (
    <TouchableOpacity
      className="flex-row items-center"
      onPress={() =>
        setActiveFeed(activeFeed === "global" ? "friends" : "global")
      }
    >
      <View
        className={`px-4 py-2 rounded-full shadow ml-2 ${
          activeFeed === "global" ? "bg-pink-600" : "bg-gray-800"
        }`}
      >
        <Ionicons
          name="radio-outline"
          size={24}
          color={
            activeFeed === "global"
              ? "white"
              : hasChallenges
              ? "deeppink"
              : "gray"
          }
        />
      </View>
    </TouchableOpacity>
  );
}
