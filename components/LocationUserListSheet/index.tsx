import React, {
  useCallback,
  useMemo,
  useState,
  RefObject,
  useEffect,
  useRef,
} from "react";
import {
  Text,
  View,
  StyleSheet,
  useColorScheme,
  BackHandler,
} from "react-native";
import HorizontalAnonList from "../HorizontalAnonList";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useLocalSearchParams } from "expo-router";
import { getBottomSheetBackgroundStyle } from "@/lib/styles";
import { useTheme } from "@/lib/theme";
import { useAtom } from "jotai";
import {
  locationUserListSheetState,
  locationUserListTaskIdState,
} from "@/lib/atoms/location";
import { NativeEventSubscription } from "react-native";

interface LocationUserListSheetProps {
  bottomSheetRef: RefObject<BottomSheet>;
}

const LocationUserListSheet = ({
  bottomSheetRef,
}: LocationUserListSheetProps) => {
  const theme = useTheme();
  const snapPoints = useMemo(() => ["50%"], []);
  const [visible, setVisible] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useAtom(
    locationUserListSheetState
  );
  const [taskId] = useAtom(locationUserListTaskIdState);
  const backHandlerSubscriptionRef = useRef<NativeEventSubscription | null>(
    null
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      const isBottomSheetVisible = index >= 0;

      // Handle back button
      if (isBottomSheetVisible && !backHandlerSubscriptionRef.current) {
        backHandlerSubscriptionRef.current = BackHandler.addEventListener(
          "hardwareBackPress",
          () => {
            bottomSheetRef.current?.close();
            return true;
          }
        );
      } else if (!isBottomSheetVisible) {
        backHandlerSubscriptionRef.current?.remove();
        backHandlerSubscriptionRef.current = null;
      }

      // Handle state management
      if (index === 0) {
        setVisible(true);
        setIsBottomSheetOpen(true);
      } else {
        setVisible(false);
        setIsBottomSheetOpen(false);
      }
    },
    [setIsBottomSheetOpen, bottomSheetRef]
  );

  useEffect(() => {
    if (isBottomSheetOpen) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isBottomSheetOpen, bottomSheetRef]);

  // Cleanup back handler on unmount
  useEffect(() => {
    return () => {
      backHandlerSubscriptionRef.current?.remove();
    };
  }, []);

  const scheme = useColorScheme();
  const sheetBackground = getBottomSheetBackgroundStyle();
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [scheme]
  );

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        animateOnMount={false}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        backgroundStyle={sheetBackground}
        enablePanDownToClose
        enableDynamicSizing={false}
        handleIndicatorStyle={{ backgroundColor: theme.colors.text }}
        backdropComponent={renderBackdrop}
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            აქტიური
          </Text>
        </View>
        {visible && taskId && <HorizontalAnonList taskId={taskId} />}
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    position: "relative",
  },
  headerText: {
    fontSize: 24,
    height: 40,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
});

export default LocationUserListSheet;
