import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';
import { FileImage, Paperclip, ArrowUp } from '@/lib/icons';
import { useAtomValue, useSetAtom } from 'jotai';
import { hasMessageAtom, messageAtom } from '@/lib/state/chat';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { isIOS } from '@/lib/platform';
import { useTheme } from '@/lib/theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const INITIAL_HEIGHT = 40;
const MAX_HEIGHT = 120;
const ANIMATION_DURATION = 200;

interface ChatBottombarProps {
  sendMessage: (newMessage: string) => void;
}

export const BottombarIcons = [{ icon: FileImage }, { icon: Paperclip }];

export default function ChatBottombar({ sendMessage }: ChatBottombarProps) {
  const setMessage = useSetAtom(messageAtom);
  const message = useAtomValue(messageAtom);
  const setHasMessage = useSetAtom(hasMessageAtom);
  const [isFocused, setIsFocused] = useState(false);
  const [staticHeight, setStaticHeight] = useState(INITIAL_HEIGHT);
  const theme = useTheme();

  // Signal/Messenger-like colors - extract specific values to avoid capturing whole objects in worklets
  const isLightMode = useColorScheme() === 'light';
  const inputBackground = isLightMode ? '#e0e0e0' : '#1E1E1E';
  const placeholderColor = isLightMode ? '#8E8E93' : '#8A8A8E';
  const inputTextColor = theme.colors.text;
  const backgroundColor = theme.colors.background;

  useEffect(() => {
    setHasMessage(message.trim().length > 0);
  }, [message, setHasMessage]);

  const handleInputChange = useCallback(
    (text: string) => {
      setMessage(text);
    },
    [setMessage],
  );

  const inputHeight = useSharedValue(INITIAL_HEIGHT);

  // Reanimated v4: Separate animated styles for iOS (animated) and Android (static)
  // This avoids branching inside the worklet which improves performance
  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(inputHeight.value, { duration: ANIMATION_DURATION }),
  }));

  // For Android, use a static style since animations cause issues
  const androidStaticStyle = { height: staticHeight };

  const handleContentSizeChange = useCallback(
    (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const contentHeight = event.nativeEvent.contentSize.height;
      const newHeight = contentHeight + (isIOS ? 20 : 0);
      const clampedHeight = Math.min(newHeight, MAX_HEIGHT);

      if (isIOS) {
        inputHeight.value = clampedHeight;
      } else {
        setStaticHeight(clampedHeight);
      }
    },
    [inputHeight],
  );

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.inputContainer}>
        <AnimatedTextInput
          multiline
          value={message}
          onChangeText={handleInputChange}
          style={[
            styles.textInput,
            isIOS ? animatedStyle : androidStaticStyle,
            {
              color: inputTextColor,
              backgroundColor: inputBackground,
            },
          ]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="default"
          enablesReturnKeyAutomatically
          placeholder="მესიჯი"
          placeholderTextColor={placeholderColor}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onContentSizeChange={handleContentSizeChange}
        />
        <View style={styles.sendButtonContainer}>
          <SendButton sendMessage={sendMessage} />
        </View>
      </View>
    </View>
  );
}

export function SendButton({
  sendMessage,
}: {
  sendMessage: (message: string) => void;
}) {
  const message = useAtomValue(messageAtom);
  const hasText = useAtomValue(hasMessageAtom);
  const theme = useTheme();

  // Extract specific value to avoid capturing whole theme object
  const isLightBackground = theme.colors.background === '#FFFFFF';

  // Signal-like send button - blue for light mode, green for dark mode
  const sendButtonColor = isLightBackground ? '#3478F6' : '#22c55e';

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      sendMessage(trimmedMessage);
    }
  }, [message, sendMessage]);

  return (
    <TouchableOpacity
      disabled={!hasText}
      style={[
        styles.sendButton,
        { backgroundColor: sendButtonColor },
        !hasText && styles.sendButtonDisabled,
      ]}
      onPress={handleSend}
    >
      <ArrowUp color="white" size={20} />
    </TouchableOpacity>
  );
}

const ChatInputAnimatedWrapper = React.memo(
  ({ children }: { children: React.ReactNode }) => {
    const theme = useTheme();
    const wrapperBorderColor =
      theme.colors.background === '#FFFFFF'
        ? '#D1D1D6' // Light gray for light mode
        : '#4B5563'; // Dark gray for dark mode

    return (
      <View style={[styles.wrapper, { borderColor: wrapperBorderColor }]}>
        {children}
      </View>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.children === nextProps.children;
  },
);

ChatInputAnimatedWrapper.displayName = 'ChatInputAnimatedWrapper';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 8,
    justifyContent: 'space-between',
    width: '100%',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 6,
  },
  textInput: {
    paddingHorizontal: 12,
    paddingLeft: 14,
    paddingTop: 10,
    paddingBottom: 10,
    flex: 1,
    borderRadius: 20,
    borderWidth: 0,
  },
  sendButtonContainer: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  sendButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  disabledInputContainer: {
    minHeight: 48,
    paddingLeft: 16,
    borderColor: 'transparent',
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  disabledText: {
    color: '#ffffff',
  },
  wrapper: {
    flex: 1,
    borderWidth: 0,
    paddingVertical: 15,
    borderRadius: 9999,
  },
});
