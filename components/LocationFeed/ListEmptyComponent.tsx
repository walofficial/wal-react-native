import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import LocationLabel from "../LocationLabel";
import { isWeb } from "@/lib/platform";
import { useTheme, Theme } from "@/lib/theme";

export function ListEmptyComponent({
  isFetching,
  isGettingLocation,
  isUserInSelectedLocation,
  selectedLocation,
  handleOpenMap,
  isCountryFeed,
}: {
  isFetching: boolean;
  isGettingLocation: boolean;
  isUserInSelectedLocation: boolean;
  selectedLocation: any;
  handleOpenMap: () => void;
  isCountryFeed: boolean;
}) {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  if (isFetching || isGettingLocation) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.text} />
      </View>
    );
  }

  if (isWeb) {
    return null;
  }

  if (isGettingLocation) {
    return null;
  }

  const mainView = isUserInSelectedLocation ? (
    <Text style={styles.emptyText}>{"..."}</Text>
  ) : (
    <View style={styles.mainContainer}>
      <Text style={styles.instructionText}>
        გამოსაქვეყნებლად საჭიროა ლოკაციაზე მისვლა
      </Text>
      {selectedLocation &&
        selectedLocation.task &&
        selectedLocation.nearest_location && (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleOpenMap}
          >
            <LocationLabel
              locationName={selectedLocation?.task.display_name}
              address={selectedLocation?.nearest_location.address}
            />
          </TouchableOpacity>
        )}
    </View>
  );

  return !isFetching && <View style={styles.container}>{mainView}</View>;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      height: 400,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    mainContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    emptyText: {
      color: theme.colors.feedItem.secondaryText,
      height: 400,
      textAlign: "center",
      marginBottom: theme.spacing.md * 1.5, // 24px
    },
    instructionText: {
      color: theme.colors.text,
      textAlign: "center",
      fontSize: theme.fontSizes.md,
      marginBottom: theme.spacing.xl + theme.spacing.sm, // 40px
    },
    locationButton: {
      width: "100%",
    },
  });
