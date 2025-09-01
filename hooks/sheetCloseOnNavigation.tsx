import { BackHandler, NativeEventSubscription } from 'react-native';
import BottomSheet, {
  BottomSheetModal,
  BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect } from 'react';
import { useRef } from 'react';

export const useSheetCloseOnNavigation = (
  bottomSheetRef: React.RefObject<BottomSheetModal | null>,
) => {
  const backHandlerSubscriptionRef = useRef<NativeEventSubscription | null>(
    null,
  );

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      if (backHandlerSubscriptionRef.current) {
        backHandlerSubscriptionRef.current.remove();
        backHandlerSubscriptionRef.current = null;
      }
    };
  }, []);

  const handleSheetPositionChange = useCallback<
    NonNullable<BottomSheetModalProps['onChange']>
  >(
    (index) => {
      const isBottomSheetVisible = index >= 0;
      if (isBottomSheetVisible && !backHandlerSubscriptionRef.current) {
        // setup the back handler if the bottom sheet is right in front of the user
        backHandlerSubscriptionRef.current = BackHandler.addEventListener(
          'hardwareBackPress',
          () => {
            bottomSheetRef.current?.close();
            return true;
          },
        );
      } else if (!isBottomSheetVisible) {
        backHandlerSubscriptionRef.current?.remove();
        backHandlerSubscriptionRef.current = null;
      }
    },
    [bottomSheetRef, backHandlerSubscriptionRef],
  );
  return { handleSheetPositionChange };
};

export default useSheetCloseOnNavigation;
