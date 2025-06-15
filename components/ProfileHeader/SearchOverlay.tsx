import React, { useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  Keyboard,
  BackHandler,
} from "react-native";
import { useAtom, useSetAtom } from "jotai";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { TabBarIcon } from "../navigation/TabBarIcon";
import { Text } from "../ui/text";
import { useColorScheme } from "@/lib/useColorScheme";
import {
  searchInputValueAtom,
  setDebouncedSearchAtom,
} from "@/lib/state/search";

interface SearchOverlayProps {
  isSearchActive: boolean;
  onSearchCancel: () => void;
}

export function SearchOverlay({
  isSearchActive,
  onSearchCancel,
}: SearchOverlayProps) {
  const { isDarkColorScheme } = useColorScheme();
  const [searchValue, setSearchValue] = useAtom(searchInputValueAtom);
  const setDebouncedSearch = useSetAtom(setDebouncedSearchAtom);
  const searchInputRef = useRef<TextInput>(null);

  // Animated values for search bar
  const searchBarOpacity = useSharedValue(0);
  const searchBarTranslateY = useSharedValue(-50);

  const handleSearchChange = (text: string) => {
    setDebouncedSearch(text);
  };

  const handleSearchSubmit = () => {
    // Dismiss keyboard on search submit
    Keyboard.dismiss();
  };

  // Handle Android back button when search is active
  useEffect(() => {
    if (!isSearchActive || Platform.OS !== "android") return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isSearchActive) {
          onSearchCancel();
          return true; // Prevent default back behavior
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [isSearchActive, onSearchCancel]);

  // Sync animations with search state
  useEffect(() => {
    if (isSearchActive) {
      searchBarOpacity.value = withTiming(1, { duration: 300 });
      searchBarTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      // Focus input after animation
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      searchBarOpacity.value = withTiming(0, { duration: 200 });
      searchBarTranslateY.value = withTiming(-50, { duration: 200 });
    }
  }, [isSearchActive]);

  // Dismiss keyboard when scrolling starts (if search is active)
  useEffect(() => {
    if (!isSearchActive) return;

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        // Optional: You can add logic here if needed when keyboard hides
      }
    );

    return () => {
      keyboardDidHideListener.remove();
    };
  }, [isSearchActive]);

  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: searchBarOpacity.value,
      transform: [{ translateY: searchBarTranslateY.value }],
    };
  });

  return (
    <Animated.View
      style={[styles.searchBarOverlay, searchBarAnimatedStyle]}
      pointerEvents={isSearchActive ? "auto" : "none"}
    >
      <View
        style={[
          styles.searchBarContainer,
          isDarkColorScheme
            ? styles.searchBarContainerDark
            : styles.searchBarContainerLight,
          Platform.OS === "android"
            ? styles.searchBarContainerAndroid
            : styles.searchBarContainerIOS,
        ]}
      >
        <TabBarIcon
          name="search"
          color={isDarkColorScheme ? "#8E8E93" : "#8E8E93"}
          size={20}
          style={styles.searchIcon}
        />
        <View style={styles.searchInputWrapper}>
          <TextInput
            ref={searchInputRef}
            style={[
              styles.searchInput,
              isDarkColorScheme
                ? styles.searchInputDark
                : styles.searchInputLight,
              Platform.OS === "ios"
                ? styles.searchInputIOS
                : styles.searchInputAndroid,
            ]}
            value={searchValue}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            placeholder={Platform.OS === "ios" ? "ძებნა" : "ძებნა"}
            placeholderTextColor={isDarkColorScheme ? "#8E8E93" : "#8E8E93"}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            blurOnSubmit={true}
            enablesReturnKeyAutomatically={true}
            editable={isSearchActive}
          />
        </View>
        <TouchableOpacity
          onPress={onSearchCancel}
          style={styles.cancelButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Text
            style={[
              styles.cancelText,
              isDarkColorScheme
                ? styles.cancelTextDark
                : styles.cancelTextLight,
            ]}
          >
            გაუქმება
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  searchBarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 1000,
    elevation: 1000, // For Android
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 36,
    borderRadius: Platform.OS === "ios" ? 10 : 20,
    zIndex: 1001,
    elevation: 1001, // For Android
  },
  searchBarContainerIOS: {
    borderRadius: 10,
  },
  searchBarContainerAndroid: {
    borderRadius: 20,
    elevation: 2,
  },
  searchBarContainerLight: {
    backgroundColor: "#F2F2F7",
  },
  searchBarContainerDark: {
    backgroundColor: "#1C1C1E",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    paddingRight: Platform.OS === "ios" ? 8 : 10, // Reduced padding to avoid clear button conflicts
  },
  searchInputIOS: {
    height: 36,
    paddingRight: 8, // Reduced padding for iOS clear button
  },
  searchInputAndroid: {
    height: 40,
    paddingTop: 0,
    paddingBottom: 0,
  },
  searchInputLight: {
    color: "#000000",
  },
  searchInputDark: {
    color: "#FFFFFF",
  },
  cancelButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  cancelTextLight: {
    color: "#007AFF",
  },
  cancelTextDark: {
    color: "#0A84FF",
  },
  searchInputWrapper: {
    flex: 1,
  },
});
