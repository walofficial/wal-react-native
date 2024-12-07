import { View, Text, ScrollView } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import StoryButtonPlaceholder from "@/components/StoryButtonPlaceholder";
import StoryButton from "@/components/StoryButton";
import { useTaskStories } from "@/hooks/useTaskStories";
import { usePathname } from "expo-router";

function FeedStories() {
  const {
    items,
    isFetching: isStoriesFetching,
    isRefetching,
    isLoading: isStoriesLoading,
    refetch: refetchStories,
  } = useTaskStories();

  const pathname = usePathname();

  if (pathname.includes("/story/")) {
    return null;
  }

  return (
    <>
      <Text className="mb-4 pl-4 text-2xl text-white font-semibold">
        {"რა ხდება..."}
      </Text>
      <View
        className="flex-col mb-4"
        style={{
          maxHeight: 90,
          height: 90,
        }}
      >
        <ScrollView
          horizontal
          style={{ paddingBottom: 20 }}
          showsHorizontalScrollIndicator={false}
        >
          {isStoriesFetching ? (
            <>
              <View className="mx-2">
                <StoryButtonPlaceholder />
              </View>
              <View className="mx-2">
                <StoryButtonPlaceholder />
              </View>
              <View className="mx-2">
                <StoryButtonPlaceholder />
              </View>
            </>
          ) : (
            items?.map((item, index) => (
              <View key={item.task.id} className="mx-2">
                <StoryButton
                  verificationCount={item.verificationCount}
                  task={item.task}
                />
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
}

export default FeedStories;
