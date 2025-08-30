import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { TabBarIcon } from '../navigation/TabBarIcon';
import { useColorScheme } from '@/lib/useColorScheme';

interface SearchBarProps {
  showSearch: boolean;
  isSearchActive: boolean;
  onSearchPress: () => void;
  onSearchCancel: () => void;
}

export function SearchBar({
  showSearch,
  isSearchActive,
  onSearchPress,
  onSearchCancel,
}: SearchBarProps) {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <>
      {/* Search button - only show if showSearch is true */}
      {showSearch && !isSearchActive && (
        <TouchableOpacity style={styles.buttonWrapper} onPress={onSearchPress}>
          <TabBarIcon
            color={isDarkColorScheme ? 'white' : 'black'}
            name="search-outline"
          />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
