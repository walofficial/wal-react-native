import React, { RefObject, useCallback } from 'react';
import { BottomSheetFooter, BottomSheetModal } from '@gorhom/bottom-sheet';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import SpacesSheetHeader from './SpacesSheetHeader';
import { LiveKitRoom } from '@livekit/react-native';
import { useAtom } from 'jotai';
import { activeLivekitRoomState } from './atom';
import PresenceDialog from './Viewers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import SpacesBottomControls from './SpacesBottomControls';
import { isWeb } from '@/lib/platform';
import useSheetCloseOnNavigation from '@/hooks/sheetCloseOnNavigation';
import { getBottomSheetBackgroundStyle } from '@/lib/styles';
interface SpacesBottomSheetProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const SpacesBottomSheet = React.forwardRef<
  BottomSheetModal,
  SpacesBottomSheetProps
>((props, ref) => {
  const [activeLivekitRoom, setActiveLivekitRoom] = useAtom(
    activeLivekitRoomState,
  );
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const snapPoints = React.useMemo(() => ['74%', '90%'], []);
  useSheetCloseOnNavigation(ref as RefObject<BottomSheetModal>);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const sheetBackgroundStyle = getBottomSheetBackgroundStyle();

  // renders
  const renderFooter = useCallback(
    (props: any) => (
      <BottomSheetFooter {...props} style={{ backgroundColor: 'black' }}>
        {activeLivekitRoom && (
          <SpacesBottomControls isHost={activeLivekitRoom?.is_host || false} />
        )}
      </BottomSheetFooter>
    ),
    [activeLivekitRoom],
  );

  if (!activeLivekitRoom) {
    return null;
  }

  return (
    <>
      {!isWeb && (
        <LiveKitRoom
          serverUrl={'wss://ment-6gg5tj49.livekit.cloud'}
          token={activeLivekitRoom.livekit_token}
          onError={(error: Error) => {
            // toast(error.message);
          }}
          connect={true}
          options={{
            adaptiveStream: { pixelDensity: 'screen' },
          }}
          audio={false}
          video={false}
          onDisconnected={() => {
            queryClient.invalidateQueries({
              queryKey: ['room-preview', activeLivekitRoom.livekit_room_name],
            });
            setActiveLivekitRoom(null);
          }}
        >
          <BottomSheet
            ref={ref}
            index={0}
            onChange={(index) => {
              if (index === -1) {
                setActiveLivekitRoom(null);
              }
            }}
            android_keyboardInputMode={'adjustResize'}
            topInset={insets.top}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            backgroundStyle={sheetBackgroundStyle}
            handleIndicatorStyle={{
              backgroundColor: '#383838',
            }}
            footerComponent={renderFooter}
          >
            <SpacesSheetHeader
              bottomSheetRef={ref as React.RefObject<BottomSheetModal>}
            />

            <PresenceDialog isHost={activeLivekitRoom.is_host} />
          </BottomSheet>
        </LiveKitRoom>
      )}
    </>
  );
});

export default SpacesBottomSheet;
