import { View, TextInput, Platform, Text, StyleSheet } from "react-native";
import AccessView from "../AccessView";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetFooter,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const UserLogin = forwardRef<BottomSheet>(function UserLogin(_, ref) {
  // state
  const [keyboardBehavior, setKeyboardBehavior] = useState<
    "extend" | "fillParent" | "interactive"
  >("interactive");
  const [keyboardBlurBehavior, setKeyboardBlurBehavior] = useState<
    "none" | "restore"
  >("none");
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ["90%"], []);

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
      topInset={insets.top + (Platform.OS === "android" ? 50 : 0)}
      snapPoints={snapPoints}
      bottomInset={0}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      onChange={(index) => {
        if (index === 0) {
          inputRef.current?.focus();
        }
      }}
      keyboardBehavior={Platform.OS === "ios" ? keyboardBehavior : "none"}
      keyboardBlurBehavior={keyboardBlurBehavior}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "black" }}
      handleIndicatorStyle={{ backgroundColor: "white" }}
    >
      <View style={styles.container}>
        <AccessView ref={inputRef} />
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 100,
  },
});

export default UserLogin;
