import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Platform,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useAtom } from "jotai";
import { activeSourcesState, newsBottomSheetState } from "@/lib/atoms/news";
import { SourceIcon } from "@/components/SourceIcon";
import useSheetCloseOnNavigation from "@/hooks/sheetCloseOnNavigation";
import { getBottomSheetBackgroundStyle } from "@/lib/styles";
import { useTheme } from "@/lib/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isAndroid } from "@/lib/platform";
import { Portal } from "@gorhom/portal";

interface NewsSourcesBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
}

export default function NewsSourcesBottomSheet({
  bottomSheetRef,
}: NewsSourcesBottomSheetProps) {
  const theme = useTheme();
  const [activeSources, setActiveSources] = useAtom(activeSourcesState);
  const [isBottomSheetOpen, setIsBottomSheetOpen] =
    useAtom(newsBottomSheetState);
  const snapPoints = React.useMemo(() => ["50%"], []);
  const { handleSheetPositionChange } = useSheetCloseOnNavigation(
    bottomSheetRef as React.RefObject<BottomSheetModal>
  );
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isBottomSheetOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
      setActiveSources(null);
    }
  }, [isBottomSheetOpen]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );
  const sheetBackgroundStyle = getBottomSheetBackgroundStyle();

  const handleClose = () => {
    bottomSheetRef.current?.close();
    setIsBottomSheetOpen(false);
  };

  return (
    <Portal name="news-sources-bottom-sheet">
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        topInset={insets.top + (isAndroid ? 50 : 50)}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={sheetBackgroundStyle}
        handleIndicatorStyle={{ backgroundColor: theme.colors.text }}
        onClose={handleClose}
        onChange={(index) => {
          handleSheetPositionChange(index);
          setIsBottomSheetOpen(index !== -1);
          if (index === -1) {
            setActiveSources(null);
          }
        }}
        animateOnMount
        enableContentPanningGesture
      >
        <BottomSheetScrollView>
          <View style={styles.container}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              წყარო
            </Text>
            {activeSources?.map((source, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sourceItem}
                onPress={() => Linking.openURL(source.uri)}
              >
                <SourceIcon sourceUrl={source.uri} fallbackUrl={source.uri} />
                <Text
                  numberOfLines={4}
                  style={[styles.sourceName, { color: theme.colors.text }]}
                >
                  {source.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  sourceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  sourceName: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
});
