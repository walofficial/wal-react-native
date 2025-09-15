import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isAndroid } from '@/lib/platform';
import { useTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

interface PostControlsProps {
  feedId: string;
  charactersLeft: number;
  onImagePress: () => void;
  disableImagePicker?: boolean;
  disableRoomCreation?: boolean;
  showFactCheck?: boolean;
  isFactCheckEnabled?: boolean;
  onFactCheckToggle?: (enabled: boolean) => void;
  selectedImagesCount?: number;
  maxImages?: number;
}

export default function PostControls({
  feedId,
  charactersLeft,
  onImagePress,
  disableImagePicker = false,
  disableRoomCreation = false,
  showFactCheck = false,
  isFactCheckEnabled = false,
  onFactCheckToggle,
  selectedImagesCount = 0,
  maxImages = 3,
}: PostControlsProps) {
  const router = useRouter();
  const inserts = useSafeAreaInsets();
  const theme = useTheme();

  // Calculate if we should show character count (when user has used > 80% of chars)
  const MAX_CHARS = 1500; // This should match the MAX_CHARS from create-post.tsx
  const charsUsed = MAX_CHARS - charactersLeft;
  const showCharCount = charsUsed > MAX_CHARS * 0.8;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: inserts.bottom + (isAndroid ? 20 : 0),
        },
      ]}
    >
      <View style={styles.actionButtonsContainer}>
        <>
          {!disableImagePicker && (
            <TouchableOpacity onPress={onImagePress} style={styles.imageButton}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="images-outline"
                  size={22}
                  color={theme.colors.text}
                />
              </View>
              <Text
                style={[styles.imageButtonText, { color: theme.colors.text }]}
              >
                {t('common.add_photo')}
              </Text>
            </TouchableOpacity>
          )}

          {/* {!disableRoomCreation && (
            <TouchableOpacity
              onPress={() => {
                router.replace({
                  pathname: "/(tabs)/(home)/create-space",
                  params: { feedId },
                });
              }}
              style={styles.roomButton}
            >
              <View style={styles.roomIconContainer}>
                <View style={styles.activeIndicator} />
                <Ionicons name="mic-outline" size={22} color="#007AFF" />
              </View>
              <Text style={styles.roomButtonText}>ოთახის შექმნა</Text>
            </TouchableOpacity>
          )} */}
        </>
      </View>
      <View style={styles.rightSection}>
        {selectedImagesCount > 0 && (
          <Text style={[styles.imageCount, { color: theme.colors.secondary }]}>
            {selectedImagesCount}/{maxImages}
          </Text>
        )}
        {showCharCount && (
          <Text
            style={[
              styles.charactersLeft,
              {
                color:
                  charactersLeft < 100 ? '#ef4444' : theme.colors.secondary,
              },
            ]}
          >
            {charactersLeft}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  iconContainer: {
    marginRight: 8,
  },
  imageButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  imageCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  roomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  roomIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
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
  roomButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  charactersLeft: {
    fontSize: 14,
  },
});
