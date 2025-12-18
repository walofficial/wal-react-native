import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { getBottomSheetBackgroundStyle } from '@/lib/styles';
import useAuth from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import {
  getUserProfileUserProfileUserIdGetQueryKey,
  getVerificationsInfiniteQueryKey,
  updateUserMutation,
  uploadUserPhotosMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { formDataBodySerializer } from '@/lib/utils/form-data';
import { LOCATION_FEED_PAGE_SIZE } from '@/lib/constants';
import { FontSizes, useTheme } from '@/lib/theme';

export default function ProfilePhotoEditSheet({
  bottomSheetRef,
}: {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
}) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user, setAuthUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const snapPoints = useMemo(() => ['25%'], []);
  const sheetBackgroundStyle = getBottomSheetBackgroundStyle();

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

  const updateUser = useMutation({
    onMutate: (variables) => {
      if (!user) return;
      setAuthUser({
        ...user,
        photos: variables.body.photos ? [variables.body.photos[0]] : [],
      });
    },
    ...updateUserMutation(),
    onSuccess: () => {
      if (!user?.id) return;
      queryClient.invalidateQueries({
        queryKey: getVerificationsInfiniteQueryKey({
          query: {
            target_user_id: user.id,
            page_size: LOCATION_FEED_PAGE_SIZE,
          },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getUserProfileUserProfileUserIdGetQueryKey({
          path: {
            user_id: user.id,
          },
        }),
      });
    },
    onError: () => {
      Alert.alert(t('common.error_title'), t('common.user_update_failed'));
    },
  });

  const resizeImage = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Error resizing image', error);
      return null;
    }
  };

  const uploadMutation = useMutation({
    ...uploadUserPhotosMutation(),
    onSuccess: (data) => {
      setIsLoading(false);
      bottomSheetRef.current?.close();
      updateUser.mutate({
        body: {
          photos: [data[0]],
        },
      });
    },
    onError: () => {
      setIsLoading(false);
      Alert.alert(t('common.error_title'), t('common.photo_upload_failed'));
    },
  });

  const handleTakePhoto = async () => {
    bottomSheetRef.current?.close();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permission_needed'),
        t('common.camera_permission_required'),
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setIsLoading(true);
      const resizedUri = await resizeImage(result.assets[0].uri);
      if (resizedUri) {
        const file = {
          uri: resizedUri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        };
        uploadMutation.mutate({
          ...formDataBodySerializer,
          body: { files: [file as any] },
        });
      }
    }
  };

  const handlePickImage = async () => {
    bottomSheetRef.current?.close();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setIsLoading(true);
      const resizedUri = await resizeImage(result.assets[0].uri);
      if (resizedUri) {
        const file = {
          uri: resizedUri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        };
        uploadMutation.mutate({
          ...formDataBodySerializer,
          body: { files: [file as any] },
        });
      }
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      backdropComponent={renderBackdrop}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      backgroundStyle={sheetBackgroundStyle}
    >
      <View style={styles.bottomSheetContent}>
        <TouchableOpacity
          onPress={handleTakePhoto}
          style={styles.bottomSheetButton}
          disabled={isLoading || uploadMutation.isPending || updateUser.isPending}
        >
          <Ionicons name="camera-outline" size={24} color={theme.colors.icon} />
          <Text
            style={[styles.bottomSheetButtonText, { color: theme.colors.text }]}
          >
            {t('common.camera')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePickImage}
          style={styles.bottomSheetButton}
          disabled={isLoading || uploadMutation.isPending || updateUser.isPending}
        >
          <Ionicons name="images-outline" size={24} color={theme.colors.icon} />
          <Text
            style={[styles.bottomSheetButtonText, { color: theme.colors.text }]}
          >
            {t('common.upload_from_gallery')}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bottomSheetButton: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomSheetButtonText: {
    marginLeft: 16,
    fontSize: FontSizes.medium,
  },
});


