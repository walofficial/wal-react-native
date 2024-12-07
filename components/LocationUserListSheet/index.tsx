import { Text, Platform } from "react-native";
import HorizontalAnonList from "../HorizontalAnonList";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useRef, forwardRef, useState } from "react";

const LocationUserListSheet = forwardRef<BottomSheet>((props, ref) => {
  const snapPoints = useMemo(() => ["50%"], []);
  const [visible, setVisible] = useState(false);
  const handleSheetChange = useCallback((index: number) => {
    if (index === 0) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, []);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      animateOnMount={false}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      backgroundStyle={{
        backgroundColor: Platform.OS === "ios" ? "black" : "black",
      }}
      enablePanDownToClose
      enableDynamicSizing={false}
      handleIndicatorStyle={{ backgroundColor: "white" }}
      backdropComponent={renderBackdrop}
    >
      <Text className="text-2xl font-bold mb-3 text-center text-white">
        აქტიური
      </Text>
      {/* <HorizontalFriendsList taskId={props.payload?.taskId} /> */}
      {visible && <HorizontalAnonList taskId={props.taskId} />}
    </BottomSheet>
  );
});

export default LocationUserListSheet;
