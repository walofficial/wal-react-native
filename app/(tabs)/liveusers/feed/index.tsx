import { Text } from "@/components/ui/text";
import { RefreshControl, ScrollView, View } from "react-native";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import useLocationsInfo from "@/hooks/useLocationsInfo";
import { Avatar } from "@/components/ui/avatar";
import { convertToCDNUrl } from "@/lib/utils";
import { LocationsResponse } from "@/lib/interfaces";
import { useNavigation, useRouter } from "expo-router";
import { HEADER_HEIGHT } from "@/lib/constants";
import { Suspense, useEffect, useRef } from "react";
import api from "@/lib/api";
import ScreenLoader from "@/components/ScreenLoader";
import ImageLoader from "@/components/ImageLoader";
import { cx } from "class-variance-authority";
import { toast } from "@backpackapp-io/react-native-toast";
import { useAtomValue } from "jotai";
import useGoLive from "@/hooks/useGoLive";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SheetManager } from "react-native-actions-sheet";
import ContactSyncSheet from "@/components/ContactSyncSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import EnableNotifications from "@/components/EnableNotifications";

export default function TaskScrollableView() {
  const {
    data: data,
    isFetching,
    isRefetching,
    refetch,
  } = useLocationsInfo("669e9a03dd31644abb767337");

  const headerHeight = useAtomValue(HEADER_HEIGHT);
  const sheetRef = useRef<BottomSheet>(null);
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      sheetRef.current?.close();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const checkAndShowSheet = async () => {
      const hasShownSheet = await AsyncStorage.getItem(
        "has_shown_contact_sync"
      );
      if (!hasShownSheet) {
        setTimeout(() => {
          sheetRef.current?.expand();
        }, 1000);
        await AsyncStorage.setItem("has_shown_contact_sync", "true");
      }
    };

    checkAndShowSheet();
  }, []);

  return (
    <>
      {isFetching && !isRefetching && <ScreenLoader />}
      <EnableNotifications hidden={true} />

      <ScrollView
        className="mt-2 flex-1"
        refreshControl={
          <RefreshControl
            progressViewOffset={100}
            refreshing={false}
            onRefresh={refetch}
          />
        }
      >
        <View className="flex-1 px-4" style={{ paddingTop: headerHeight }}>
          <TaskAtLocationList tasksAtLocation={data.tasks_at_location} />
          <NearLocationList nearestTasks={data.nearest_tasks} />
        </View>
      </ScrollView>
      <Suspense fallback={null}>
        <ContactSyncSheet ref={sheetRef} />
      </Suspense>
    </>
  );
}

function LocationListItem({
  isNearLocation,
  task,
  address,
  onPress,
  disabled,
}: {
  isNearLocation?: boolean;
  task: any;
  address?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      className={cx(
        "w-full mt-3 p-4 rounded-2xl flex-1 relative flex-row shadow-lg",
        disabled && "opacity-50"
      )}
      style={{
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        borderWidth: 2,
        borderColor: isNearLocation ? "rgba(255,255,255,0.1)" : "transparent",
      }}
      key={task.id}
      onPress={onPress}
      disabled={disabled}
    >
      {task.task_verification_example_sources[0]?.image_media_url && (
        <Avatar style={{ width: 70, height: 70 }} alt="Avatar">
          <ImageLoader
            aspectRatio={1 / 1}
            source={{
              uri: convertToCDNUrl(
                task.task_verification_example_sources[0]?.image_media_url
              ),
            }}
            className="rounded-full"
          />
        </Avatar>
      )}
      <View className="flex-1 px-4">
        <Text className="text-white text-xl font-bold mb-1">
          {task.display_name}
        </Text>
        {address && (
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#9ca3af" />
            <Text className="text-gray-400 ml-1 text-sm">{address}</Text>
          </View>
        )}
        <View className="flex-row items-start mt-1 space-x-4">
          {task.live_user_count !== 0 && (
            <View className="flex items-center mr-3 flex-row">
              <Ionicons name="people" size={20} color="deeppink" />
              <Text className="text-gray-300 ml-2 text-sm">
                {task.live_user_count || "0"}
              </Text>
            </View>
          )}
          {task.verification_count > 0 && (
            <View className="flex items-center flex-row">
              <Ionicons name="image-outline" size={20} color="#9ca3af" />
              <Text className="text-gray-300 ml-2 text-sm">
                {task.verification_count}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View className="justify-center">
        <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );
}

function NearLocationList({
  nearestTasks,
}: {
  nearestTasks: LocationsResponse["nearest_tasks"];
}) {
  const { goLiveMutation } = useGoLive();
  const navigate = useRouter();

  if (!nearestTasks?.length) {
    return null;
  }

  return (
    <>
      <View className="flex-row items-center mt-4 mb-4">
        <Ionicons name="location" size={24} color="white" />
        <Text className="ml-2 text-2xl text-white font-semibold">
          {"შენთან ახლოს"}
        </Text>
      </View>
      <ScrollView>
        {nearestTasks?.map(({ task, nearest_location }) => (
          <LocationListItem
            key={task.id}
            task={task}
            address={nearest_location.address}
            onPress={async () => {
              navigate.navigate({
                pathname: "/(tabs)/liveusers/feed/[taskId]",
                params: {
                  taskId: task.id,
                },
              });
              await goLiveMutation.mutateAsync(task.id);
            }}
          />
        ))}
      </ScrollView>
    </>
  );
}

function TaskAtLocationList({
  tasksAtLocation,
}: {
  tasksAtLocation: LocationsResponse["tasks_at_location"];
}) {
  const queryClient = useQueryClient();
  const { goLiveMutation } = useGoLive();
  const navigate = useRouter();

  useEffect(() => {
    if (tasksAtLocation?.length) {
      tasksAtLocation.slice(0, 2).forEach((task) => {
        queryClient.prefetchInfiniteQuery({
          queryKey: ["location-feed-paginated", task.id],
          queryFn: ({ pageParam = 1 }) =>
            api.getLocationFeedPaginated(task.id, pageParam),
          getNextPageParam: (lastPage) => {
            if (lastPage.data.length < 10) {
              return undefined;
            }
            return lastPage.page + 1;
          },
          initialPageParam: 1,
          retry: 2,
        });
      });
    }
  }, [tasksAtLocation]);

  if (!tasksAtLocation?.length) {
    return null;
  }

  return (
    <>
      <View className="flex-row items-center mt-4 mb-4">
        <Text className="ml-2 text-2xl text-white font-semibold">
          {"აირჩიე"}
        </Text>
      </View>
      <ScrollView>
        {tasksAtLocation?.map((task) => (
          <LocationListItem
            isNearLocation
            key={task.id}
            task={task}
            onPress={async () => {
              toast.remove();
              navigate.navigate({
                pathname: "/(tabs)/liveusers/feed/[taskId]",
                params: {
                  taskId: task.id,
                },
              });
              await goLiveMutation.mutateAsync(task.id);
            }}
          />
        ))}
      </ScrollView>
    </>
  );
}
