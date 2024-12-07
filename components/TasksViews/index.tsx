import { View, Text, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { FlashList } from "@shopify/flash-list";
import TaskPreviewScene from "@/components/TaskPreviewScene";
import { Button } from "@/components/ui/button";
import { taskIdInViewAtom } from "../UserSelectedTask/atom";
import { useAtomValue, useSetAtom } from "jotai";
import {
  ActualDimensionsProvider,
  dimensionsState,
} from "../ActualDimensionsProvider";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TasksView({
  tasks,
  defaultIndex,
}: {
  tasks: any;
  defaultIndex: number;
}) {
  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
  const router = useRouter();
  const flashListRef = useRef<FlashList<any>>(null);
  const setTaskIdInView = useSetAtom(taskIdInViewAtom);
  const { width: actualWidth, height: actualHeight } = useAtomValue(
    dimensionsState
  ) ?? { width: 0, height: 0 };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setTaskIdInView(viewableItems[0].item?.id);
      setCurrentViewableItemIndex(viewableItems[0].index ?? 0);
    }
  };

  const [currentViewableItemIndex, setCurrentViewableItemIndex] =
    useState(defaultIndex);

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (flashListRef.current && defaultIndex > 0) {
      flashListRef.current.scrollToIndex({
        index: defaultIndex,
        animated: false,
      });
      setTaskIdInView(tasks[defaultIndex].id);
    }
  }, [defaultIndex]);

  const renderEmptyComponent = () => (
    <View
      className="flex-1 items-center justify-center"
      style={{
        paddingTop: 200,
      }}
    >
      <Text className="text-white text-center text-lg">
        დავალებები არ მოიძებნა ამ კატეგორიისთვის
      </Text>
      <Button
        onPress={() => {
          router.back();
        }}
        size="lg"
        variant="outline"
        className="mt-4"
      >
        <Text className="text-white text-xl">უკან გადასვლა</Text>
      </Button>
    </View>
  );

  const heightOffset = Platform.OS === "ios" ? insets.top : 0;

  return (
    <ActualDimensionsProvider useNativeDimensions={Platform.OS === "ios"}>
      <View className="flex-1">
        <FlashList
          ref={flashListRef}
          data={tasks || []}
          renderItem={({ item, index }) => (
            <TaskPreviewScene
              hideTopControls={true}
              shouldPlay={currentViewableItemIndex === index}
              task={item}
            />
          )}
          viewabilityConfig={{
            minimumViewTime: 50,
            itemVisiblePercentThreshold: 80,
          }}
          snapToInterval={actualHeight - heightOffset}
          snapToAlignment="start"
          decelerationRate={"fast"}
          estimatedListSize={{
            height: actualHeight - heightOffset,
            width: actualWidth,
          }}
          estimatedItemSize={actualHeight - heightOffset}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          viewabilityConfigCallbackPairs={
            viewabilityConfigCallbackPairs.current
          }
          ListEmptyComponent={renderEmptyComponent}
        />
      </View>
    </ActualDimensionsProvider>
  );
}
