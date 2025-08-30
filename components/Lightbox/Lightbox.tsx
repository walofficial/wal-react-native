import React from 'react';
import * as MediaLibrary from 'expo-media-library';

// import {saveImageToMediaLibrary, shareImageModal} from '#/lib/media/manip'
import { useLightbox, useLightboxControls } from '@/lib/lightbox/lightbox';
import ImageView from './ImageViewing';
import { useToast } from '@/components/ToastUsage';
import { t } from '@/lib/i18n';

export function Lightbox() {
  const { activeLightbox } = useLightbox();
  const { closeLightbox } = useLightboxControls();
  const { error: errorToast } = useToast();

  const onClose = React.useCallback(() => {
    closeLightbox();
  }, [closeLightbox]);

  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'],
  });
  const saveImageToAlbumWithToasts = React.useCallback(
    async (uri: string) => {
      if (!permissionResponse || permissionResponse.granted === false) {
        errorToast({
          title: t('errors.camera_permission_required'),
          description: t('errors.camera_permission_required'),
        });
        if (permissionResponse?.canAskAgain) {
          requestPermission();
        } else {
          errorToast({
            title: t('errors.camera_permission_denied'),
            description: t('errors.camera_permission_denied'),
          });
        }
        return;
      }
      try {
        // await saveImageToMediaLibrary({ uri });
      } catch (e: any) {
        errorToast({
          title: t('errors.failed_save_image'),
          description: `${t('errors.failed_save_image')}: ${String(e)}`,
        });
      }
    },
    [permissionResponse, requestPermission],
  );

  return (
    <ImageView
      lightbox={activeLightbox}
      onRequestClose={onClose}
      onPressSave={saveImageToAlbumWithToasts}
      onPressShare={(uri) => {
        // toast("Share image");
      }}
    />
  );
}
