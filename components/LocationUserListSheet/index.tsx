import React, {
  useCallback,
  useMemo,
  useState,
  RefObject,
  useEffect,
  useRef,
} from 'react';
import {
  Text,
  View,
  StyleSheet,
  useColorScheme,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import HorizontalAnonList from '../HorizontalAnonList';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getBottomSheetBackgroundStyle } from '@/lib/styles';
import { useTheme } from '@/lib/theme';
import { useAtom } from 'jotai';
import { locationUserListSheetState } from '@/lib/atoms/location';
import { NativeEventSubscription } from 'react-native';
import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';

interface LocationUserListSheetProps {
  bottomSheetRef: RefObject<BottomSheet>;
}

const LocationUserListSheet = ({
  bottomSheetRef,
}: LocationUserListSheetProps) => {
  const theme = useTheme();
  const snapPoints = useMemo(() => ['50%'], []);
  const [visible, setVisible] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useAtom(
    locationUserListSheetState,
  );
  const { feedId } = useLocalSearchParams<{ feedId: string }>();
  const backHandlerSubscriptionRef = useRef<NativeEventSubscription | null>(
    null,
  );

  const router = useRouter();

  const handleSheetChange = useCallback(
    (index: number) => {
      const isBottomSheetVisible = index >= 0;

      // Handle back button
      if (isBottomSheetVisible && !backHandlerSubscriptionRef.current) {
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

      // Handle state management
      if (index === 0) {
        setVisible(true);
        setIsBottomSheetOpen(true);
      } else {
        setVisible(false);
        setIsBottomSheetOpen(false);
      }
    },
    [setIsBottomSheetOpen, bottomSheetRef],
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
    [scheme],
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
            {t('common.active')}
          </Text>
          {/* <TouchableOpacity
              onPress={() => {
                router.navigate({
                  pathname: "/(tabs)/(home)/create-space",
                  params: { feedId },
                });
                bottomSheetRef.current?.close();
              }}
              style={[styles.roomButton, { position: 'absolute', right: 16 }]}
            >
              <View style={styles.roomIconContainer}>
                <Ionicons name="mic-outline" size={22} color="#007AFF" />
              </View>
            </TouchableOpacity> */}
        </View>
        {visible && feedId && <HorizontalAnonList feedId={feedId} />}
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    position: 'relative',
    paddingVertical: 15,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  roomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  roomButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  roomIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    backgroundColor: '#007AFF',
    borderRadius: 3,
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 1,
  },
});

export default LocationUserListSheet;
