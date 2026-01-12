'use client';

import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import Button from '@/components/Button';
import { compressIfNeeded, getImageDim } from '@/lib/media/manip';
import { SocketContext } from '@/components/Chat/socket/context';
import { uploadChatAttachment } from '@/lib/api/generated/sdk.gen';
import { formDataBodySerializer } from '@/lib/utils/form-data';

interface ChatSubmitButtonProps {
  mediaBlob: {
    uri: string;
    width?: number;
    height?: number;
    size?: number;
  };
  roomId: string;
  recipientId: string;
  onSubmit: () => void;
}

export default function ChatSubmitButton({
  mediaBlob,
  roomId,
  recipientId,
  onSubmit,
}: ChatSubmitButtonProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const socketContext = useContext(SocketContext);

  const handleSubmit = async () => {
    setIsProcessing(true);

    // Navigate back immediately for optimistic update
    onSubmit();

    try {
      // Get image dimensions if not provided
      let imagePath = mediaBlob.uri;
      if (imagePath.startsWith('file://')) {
        imagePath = imagePath.replace('file://', '');
      }

      let width = mediaBlob.width;
      let height = mediaBlob.height;

      if (!width || !height) {
        try {
          const dims = await getImageDim(imagePath);
          width = dims.width;
          height = dims.height;
        } catch (e) {
          // Default dimensions if we can't get them
          width = 1080;
          height = 1920;
        }
      }

      // Compress image
      const compressedImage = await compressIfNeeded(
        {
          path: imagePath,
          width: width || 1080,
          height: height || 1920,
          size: mediaBlob.size || 0,
        },
        1000000, // 1MB max size
      );

      // Ensure proper file:// prefix for FormData
      const finalUri = compressedImage.path.startsWith('file://')
        ? compressedImage.path
        : 'file://' + compressedImage.path;

      const file = {
        uri: finalUri,
        type: 'image/jpeg',
        name: compressedImage.path.split('/').pop() || 'chat_image.jpg',
      };

      // Upload to backend using SDK
      const response = await uploadChatAttachment({
        ...formDataBodySerializer,
        body: {
          file: file as any,
          room_id: roomId,
        },
      });
      if (response.data) {
        const { url, width: imgWidth, height: imgHeight } = response.data;

        // Create attachment object
        const attachment = {
          type: 'image',
          url: url,
          width: imgWidth,
          height: imgHeight,
        };

        // Emit WebSocket message with attachment
        const temporaryId = Date.now().toString();
        socketContext?.emit('private_message', {
          temporary_id: temporaryId,
          recipient: recipientId,
          room_id: roomId,
          plain_content: '', // No text content for image-only messages
          attachments: [attachment],
        });
      }
    } catch (error) {
      console.error('Error uploading chat attachment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="medium"
      onPress={handleSubmit}
      disabled={isProcessing}
      loading={isProcessing}
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
