import {
  View,
  TextInput,
  Platform,
  Text,
  StyleSheet,
  useColorScheme,
  BackHandler,
} from "react-native";
import AccessView, { CustomBottomSheetBackground } from "../AccessView";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showPhoneInputState } from "../AccessView/atom";
import { useAtom } from "jotai";
import {
  bottomSheetBackgroundStyle,
  getBottomSheetBackgroundStyle,
} from "@/lib/styles";
import useSheetCloseOnNavigation from "@/hooks/sheetCloseOnNavigation";
import { isAndroid } from "@/lib/platform";

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
  const snapPoints = useMemo(() => ["45%"], []);
  const [showPhoneInput, setShowPhoneInput] = useAtom(showPhoneInputState);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Handle Android back button manually
  useEffect(() => {
    if (isAndroid && isSheetOpen) {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (isSheetOpen) {
            (ref as React.RefObject<BottomSheet>).current?.close();
            return true;
          }
          return false;
        }
      );

      return () => backHandler.remove();
    }
  }, [ref, isSheetOpen]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="collapse"
      />
    ),
    []
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      setIsSheetOpen(index >= 0);

      if (index === 0) {
        inputRef.current?.focus();
      } else if (index === -1) {
        setShowPhoneInput(true);
      }
    },
    [inputRef, setShowPhoneInput]
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      topInset={insets.top + (isAndroid ? 50 : 0)}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      onChange={handleSheetChange}
      keyboardBlurBehavior={keyboardBlurBehavior}
      backdropComponent={renderBackdrop}
      backgroundComponent={CustomBottomSheetBackground}
      handleIndicatorStyle={{ backgroundColor: "white" }}
    >
      <AccessView inputRef={inputRef} />
    </BottomSheet>
  );
});

export default UserLogin;
