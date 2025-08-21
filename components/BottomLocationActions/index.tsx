// @ts-nocheck
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
  locationUserListfeedIdState,
} from "@/lib/atoms/location";
import { isIOS } from "@/lib/platform";

export default function BottomLocationActions({
  feedId,
  isUserInSelectedLocation,
  isFactCheckFeed,
}: {
  feedId: string;
  onExpandLiveUsers?: () => void; // Make this optional
  isUserInSelectedLocation: boolean;
  isFactCheckFeed: boolean;
}) {
  const { data } = useCountAnonList(feedId);
  const { isDarkColorScheme } = useColorScheme();
  const setIsBottomSheetOpen = useSetAtom(locationUserListSheetState);
  const setfeedId = useSetAtom(locationUserListfeedIdState);

  const handlePress = () => {
    console.log("handlePress called with feedId:", feedId, data);
    setIsBottomSheetOpen(false);
    if (data && data.count > 0) {
      setfeedId(feedId);
      setIsBottomSheetOpen(true);
    }
  };

  const bottomPosition = 20;
  return (
    <>
      {isFactCheckFeed ? (
        <View
          style={[
            styles.floatingButtonContainer,
            { bottom: isIOS ? bottomPosition : 20 },
          ]}
        >
          <CreatePostGlobal disabled={false} feedId={feedId} />
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
            <LiveUserCountIndicator feedId={feedId} />
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
