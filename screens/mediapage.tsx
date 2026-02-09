import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import { useEvent } from 'expo';
import type { ImageLoadEventData, NativeSyntheticEvent } from 'react-native';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
  Image,
  TouchableOpacity,
  Text,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaPadding } from '@/components/CameraPage/Constants';
import { Share } from 'react-native';
import { useIsForeground } from '@/hooks/useIsForeground';
import { Ionicons as IonIcon } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import {
  isAvailableAsync as isSharingAvailableAsync,
  shareAsync,
} from 'expo-sharing';
import { StatusBarBlurBackground } from '@/components/CameraPage/StatusBarBlurBackground';
import { useIsFocused } from '@react-navigation/core';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SubmitButton from '@/components/SubmitButton';
import ChatSubmitButton from '@/components/SubmitButton/ChatSubmitButton';
import ChatModeSocketProvider from '@/components/Chat/socket/ChatModeSocketProvider';
import RetryButton from '@/components/RetryButton';
import Button from '@/components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/components/ToastUsage';
import { t } from '@/lib/i18n';
import { useColorScheme } from '@/lib/useColorScheme';

// Permissions handled by expo-media-library

type OnLoadImage = NativeSyntheticEvent<ImageLoadEventData>;

export default function MediaPage(): React.ReactElement {
  const safePadding = useSafeAreaPadding();
  const { path, type, feedId, recordingTime, chatMode, roomId, recipientId } =
    useLocalSearchParams<{
      path: string;
      type: 'photo' | 'video';
      feedId: string;
      recordingTime: string;
      chatMode?: string;
      roomId?: string;
      recipientId?: string;
    }>();

  const router = useRouter();
  const isChatMode = chatMode === 'true';
  const [hasMediaLoaded, setHasMediaLoaded] = useState(false);
  const isForeground = useIsForeground();
  const isScreenFocused = useIsFocused();
  const isVideoPaused = !isForeground || !isScreenFocused;
  const [savingState, setSavingState] = useState<'none' | 'saving' | 'saved'>(
    'none',
  );

  const { success, dismiss } = useToast();

  const [mediaPath, setMediaPath] = useState<string | null>(null);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const player = useVideoPlayer(videoSource || '', (player) => {
    player.loop = false;
    player.muted = true;
  });
  const { isPlaying: playerIsPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [caption, setCaption] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Sync player playing state with local state
  useEffect(() => {
    setIsPlaying(playerIsPlaying);
  }, [playerIsPlaying]);

  useEffect(() => {
    const loadMediaPath = async () => {
      if (path) {
        setMediaPath(path as string);
        if (type === 'video') {
          setVideoSource(`file://${path}`);
        }
      } else {
        const cachedPath = await AsyncStorage.getItem(
          `lastRecordedVideoPath_${feedId}`,
        );
        setMediaPath(cachedPath);
        if (type === 'video' && cachedPath) {
          setVideoSource(`file://${cachedPath}`);
        }
      }
    };
    loadMediaPath();
  }, [path, feedId, type]);

  useEffect(() => {
    if (type === 'video' && player) {
      if (isVideoPaused) {
        player.pause();
      } else {
        player.play();
      }
    }
  }, [isVideoPaused, type, player]);

  const onMediaLoad = useCallback((event: OnLoadImage) => {
    const source = event.nativeEvent.source;
    // console.log(`Image loaded. Size: ${source.width}x${source.height}`);
  }, []);
  const onMediaLoadEnd = useCallback(() => {
    setHasMediaLoaded(true);
  }, []);
  const onMediaLoadError = useCallback((error: string) => {
    console.error(`failed to load media: ${error}`);
  }, []);

  const onSavePressed = useCallback(async () => {
    try {
      setSavingState('saving');
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        setSavingState('none');
        Alert.alert(
          'Permission denied!',
          'The app does not have permission to save media to your photo library.',
        );
        return;
      }
      const uriToSave = (path as string)?.startsWith('file://')
        ? (path as string)
        : `file://${path}`;
      await MediaLibrary.saveToLibraryAsync(uriToSave);
      setSavingState('saved');
      success({ title: 'შენახულია' });
      // Remove the saved video path from AsyncStorage after saving to camera roll
      await AsyncStorage.removeItem(`lastRecordedVideoPath_${feedId}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      setSavingState('none');
      Alert.alert(
        'Failed to save!',
        `An unexpected error occured while trying to save your ${type}. ${message}`,
      );
    }
  }, [path, type, feedId]);

  const onSharePressed = useCallback(async () => {
    try {
      const localUri = mediaPath?.startsWith('file://')
        ? (mediaPath as string)
        : `file://${mediaPath}`;

      const sharingAvailable = await isSharingAvailableAsync();
      if (sharingAvailable) {
        await shareAsync(localUri, {
          mimeType: type === 'photo' ? 'image/jpeg' : 'video/mp4',
          dialogTitle: 'Share via',
        });
      } else {
        // Fallback to RN Share with URL if expo-sharing is not available
        await Share.share({ url: localUri });
      }
    } catch (error) {
      console.log('Error =>', error);
      Alert.alert(
        'Failed to share!',
        'An unexpected error occurred while trying to share your media.',
      );
    }
  }, [mediaPath, type]);

  const source = useMemo(() => ({ uri: `file://${mediaPath}` }), [mediaPath]);
  const recordingSource = useMemo(() => ({ uri: mediaPath }), [mediaPath]);

  useEffect(() => {
    dismiss('all');
  }, []);

  const togglePlayPause = useCallback(() => {
    if (player) {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        // Check if video ended, replay from start
        if (player.currentTime >= player.duration - 0.1) {
          player.replay();
        } else {
          player.play();
        }
        setIsPlaying(true);
      }
    }
  }, [isPlaying, player]);

  const handleBack = useCallback(() => {
    if (isChatMode && roomId) {
      // Navigate back to chat
      router.dismissTo({
        pathname: '/(chat)/[roomId]',
        params: {
          roomId: roomId as string,
        },
      });
    } else {
      router.navigate({
        pathname: '/(tabs)/(home)/[feedId]',
        params: {
          feedId: feedId as string,
        },
      });
    }
  }, [router, feedId, isChatMode, roomId]);

  const handleAcceptCaption = useCallback(() => {
    Keyboard.dismiss();
    setIsInputFocused(false);
  }, []);

  const dismissKeyboard = useCallback(() => {
    if (isInputFocused) {
      Keyboard.dismiss();
      setIsInputFocused(false);
    }
  }, [isInputFocused]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const insets = useSafeAreaInsets();
  const { isDarkColorScheme } = useColorScheme();
  const floatingBg = isDarkColorScheme
    ? 'rgba(0, 0, 0, 0.5)'
    : 'rgba(255, 255, 255, 0.85)';
  const floatingIconColor = isDarkColorScheme ? '#FFFFFF' : '#000000';

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={[styles.container]}>
        {!hasMediaLoaded && (
          <View>
            <ActivityIndicator color="black" size="large" />
          </View>
        )}
        {type === 'photo' && (
          <Image
            source={source}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onLoadEnd={onMediaLoadEnd}
            onLoad={onMediaLoad}
          />
        )}
        {type === 'video' && videoSource && (
          <>
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              nativeControls={false}
              contentFit="cover"
              onFirstFrameRender={onMediaLoadEnd}
            />
            <TouchableOpacity
              style={[styles.playPauseOverlay, { opacity: isPlaying ? 0 : 1 }]}
              onPress={togglePlayPause}
            >
              <Button
                glassy
                icon="play"
                size="large"
                variant="primary"
                onPress={togglePlayPause}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                }}
              />
            </TouchableOpacity>
          </>
        )}

        <Button
          onPress={handleBack}
          icon="close"
          variant="outline"
          size="medium"
          iconColor={floatingIconColor}
          style={[
            styles.actionButton,
            {
              position: 'absolute',
              top: safePadding.paddingTop,
              left: safePadding.paddingLeft,
              backgroundColor: floatingBg,
            },
          ]}
        />

        <KeyboardAvoidingView behavior="padding">
          {/* Hide caption input in chat mode */}
          {!isChatMode && (
            <View
              style={[
                styles.captionContainer,
                { paddingBottom: insets.bottom },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[
                  styles.captionInput,
                  isInputFocused && styles.captionInputFocused,
                  {
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 8,
                  },
                ]}
                placeholder={t('common.add_caption')}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={caption}
                onChangeText={setCaption}
                multiline={false}
                maxLength={150}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              {isInputFocused && (
                <Button
                  icon="checkmark"
                  variant="subtle"
                  onPress={handleAcceptCaption}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  }}
                />
              )}
            </View>
          )}
          <View
            style={{
              flexDirection: 'row',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingBottom: insets.bottom,
            }}
          >
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Button
                onPress={onSavePressed}
                disabled={savingState !== 'none'}
                loading={savingState === 'saving'}
                icon={savingState === 'saved' ? 'checkmark' : 'download'}
                variant="default"
                iconColor={floatingIconColor}
                size="medium"
                style={[styles.actionButton, { backgroundColor: floatingBg }]}
              />

              <Button
                onPress={onSharePressed}
                icon="share-social"
                variant="default"
                iconColor={floatingIconColor}
                size="medium"
                style={[styles.actionButton, { backgroundColor: floatingBg }]}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              <RetryButton />
              {isChatMode && roomId && recipientId ? (
                <ChatModeSocketProvider>
                  <ChatSubmitButton
                    onSubmit={handleBack}
                    mediaBlob={recordingSource as any}
                    roomId={roomId}
                    recipientId={recipientId}
                  />
                </ChatModeSocketProvider>
              ) : (
                <SubmitButton
                  onSubmit={handleBack}
                  mediaBlob={recordingSource}
                  isPhoto={type === 'photo'}
                  videoDuration={recordingTime}
                  caption={caption.trim()}
                />
              )}
            </View>
          </View>
        </KeyboardAvoidingView>

        <StatusBarBlurBackground />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
    elevation: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  captionInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: 'white',
    fontSize: 16,
    height: 40,
  },
  captionInputFocused: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});
