import React, { useEffect, useRef } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import {
  ShareIntent as ShareIntentType,
  useShareIntentContext,
} from 'expo-share-intent';
import { useSession } from '@/components/AuthLayer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useFeeds from '@/hooks/useFeeds';
import { useToast } from '@/components/ToastUsage';

export default function ShareIntent() {
  const insets = useSafeAreaInsets();
  const { session, isLoading } = useSession();
  const { factCheckFeedId, newsFeedId } = useFeeds();
  const { shareIntent } = useShareIntentContext();
  const sharedContent = shareIntent?.text;
  const sharedFiles = shareIntent?.files;
  const router = useRouter();
  const { error } = useToast();
  useEffect(() => {
    if (shareIntent && !session) {
      error({ title: 'გთხოვთ შეხვიდეთ სისტემაში გასაგრძელებლად' });
    } else if (shareIntent && session) {
      // Check if we have images or text content to share
      const hasContent =
        sharedContent || (sharedFiles && sharedFiles.length > 0);
      if (hasContent) {
        // Filter for image files if any
        const imageFiles =
          sharedFiles?.filter(
            (file) =>
              file.mimeType?.startsWith('image/') ||
              file.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i),
          ) || [];

        // Convert share intent files to the format expected by create-post
        const convertedImages = imageFiles.map((file) => ({
          uri: file.path,
          width: file.width || 0,
          height: file.height || 0,
          fileSize: file.size,
          type: 'image' as const,
          fileName: file.fileName || `shared_image_${Date.now()}.jpg`,
          mimeType: file.mimeType || 'image/jpeg',
          exif: null,
          assetId: null,
          base64: null,
          duration: null,
        }));

        // Encode the images as URL parameters if we have any
        const encodedImages =
          convertedImages.length > 0
            ? encodeURIComponent(JSON.stringify(convertedImages))
            : '';

        // Build navigation params
        const params: any = {
          feedId: factCheckFeedId,
          disableRoomCreation: 'true',
        };

        if (sharedContent) {
          params.sharedContent = sharedContent;
        }

        if (encodedImages) {
          params.sharedImages = encodedImages;
        }

        router.push({
          pathname: `/(tabs)/(fact-check)/create-post`,
          params,
        });
      }
    }
  }, [shareIntent, session, sharedContent, sharedFiles]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (session) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text>ShareIntent</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
    gap: 24,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  loginSubtitle: {
    fontSize: 18,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 24,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
  },
  contentText: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 16,
    textAlign: 'center',
  },
  contentCard: {
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    overflow: 'hidden',
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  error: {
    color: '#FF453A',
    marginTop: 12,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#efefef',
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
    padding: 16,
  },
  buttonText: {
    color: 'black',
    fontSize: 20,
    fontWeight: '600',
  },
});
