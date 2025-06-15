import React from "react";
import { TouchableOpacity, View, Platform, StyleSheet } from "react-native";
import TakeVideo from "../TakeVideo";
import LiveUserCountIndicator from "../LiveUserCountIndicator";
import useCountAnonList from "../LiveUserCountIndicator/useCountAnonList";
import CreatePostGlobal from "../CreatePostGlobal";
import { useColorScheme } from "@/lib/useColorScheme";
import { useSetAtom } from "jotai";
import {
  locationUserListSheetState,
  locationUserListTaskIdState,
} from "@/lib/atoms/location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isIOS } from "@/lib/platform";
export default function BottomLocationActions({
  taskId,
  isUserInSelectedLocation,
  isCountryFeed,
}: {
  taskId: string;
  onExpandLiveUsers?: () => void; // Make this optional
  isUserInSelectedLocation: boolean;
  isCountryFeed: boolean;
}) {
  const { data } = useCountAnonList(taskId);
  const { isDarkColorScheme } = useColorScheme();
  const setIsBottomSheetOpen = useSetAtom(locationUserListSheetState);
  const setTaskId = useSetAtom(locationUserListTaskIdState);

  const handlePress = () => {
    setIsBottomSheetOpen(false);
    if (data && data > 0) {
      setTaskId(taskId);
      setIsBottomSheetOpen(true);
    }
  };

  const bottomPosition = 20;
  return (
    <>
      {isCountryFeed ? (
        <View
          style={[
            styles.floatingButtonContainer,
            { bottom: isIOS ? bottomPosition : 20 },
          ]}
        >
          <CreatePostGlobal disabled={false} taskId={taskId} />
        </View>
      ) : (
        <View style={[styles.container, { bottom: bottomPosition }]}>
          <TouchableOpacity
            onPress={handlePress}
            style={[
              styles.liveUsersButton,
              {
                opacity: !isUserInSelectedLocation ? 0.5 : 1,
                backgroundColor: isDarkColorScheme
                  ? "rgba(0,0,0,0.7)"
                  : "rgba(240,240,240,0.9)",
                borderColor: isDarkColorScheme
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
              },
            ]}
          >
            <LiveUserCountIndicator taskId={taskId} />
          </TouchableOpacity>

          <TakeVideo disabled={!isUserInSelectedLocation} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    zIndex: 20,
    pointerEvents: "box-none",
  },
  liveUsersButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    width: 110,
    zIndex: 20,
  },
  countryFeedContainer: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    width: "100%",
    justifyContent: "flex-end",
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 20,
  },
});
