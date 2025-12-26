'use client';

import React from 'react';
import { StyleSheet } from 'react-native';
import { useUploadVideo } from '@/hooks/useUploadVideo';
import { useLocalSearchParams } from 'expo-router';
import Button from '@/components/Button';
import { compressVideo } from '@/lib/media/video/compress';
import { compressIfNeeded } from '@/lib/media/manip';

export default function SubmitButton({
  mediaBlob,
  isPhoto,
  onSubmit,
  caption,
  videoDuration,
}: {
  mediaBlob: any;
  isPhoto: boolean;
  onSubmit: () => void;
  caption?: string;
  videoDuration?: string;
}) {
  const { feedId } = useLocalSearchParams<{
    feedId: string;
  }>();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { uploadBlob } = useUploadVideo({
    feedId: feedId as string,
    isPhoto,
  });
  const handleSubmit = async () => {
    setIsProcessing(true);
    onSubmit(); // This will navigate back to the chat screen

    try {
      let compressedPath = mediaBlob.uri;
      let compressedVideo = undefined;

      if (isPhoto) {
        // Compress photo if needed
        const compressedImage = await compressIfNeeded(
          {
            path: mediaBlob.uri,
            width: mediaBlob.width,
            height: mediaBlob.height,
            size: mediaBlob.size,
          },
          1000000,
        ); // 1MB max size
        compressedPath = compressedImage.path;
      } else {
        // Video compression logic remains the same
        try {
          compressedVideo = await compressVideo(mediaBlob, {
            onProgress: (progress) => {},
          });
          compressedPath = compressedVideo.uri;
        } catch (error) {
          console.error('Error during compression:', error);
        }
      }

      const file = {
        uri: 'file://' + compressedPath,
        type: isPhoto ? 'image/jpeg' : 'video/mp4',
        name: compressedPath.split('/').pop(),
      };

      await uploadBlob.mutateAsync({
        photo: file,
        video: compressedVideo,
        params: {
          feed_id: feedId,
          recording_time: videoDuration ? parseInt(videoDuration) : 0,
          text_content: caption || '',
        },
      });
    } catch (error) {
      console.error('Error during submission:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="medium"
      onPress={handleSubmit}
      disabled={isProcessing || uploadBlob.isPending}
      loading={isProcessing || uploadBlob.isPending}
      icon="arrow-up"
      iconColor="#FFFFFF"
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#007AFF',
    boxShadow: '0px 4px 12px rgba(0, 122, 255, 0.4)',
  },
});
