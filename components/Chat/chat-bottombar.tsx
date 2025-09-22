import { Link } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { FileImage, Paperclip, Mic, ArrowUp } from '@/lib/icons';
import { Audio } from 'expo-av';
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

interface ChatBottombarProps {
  sendMessage: (newMessage: string) => void;
}

export const BottombarIcons = [{ icon: FileImage }, { icon: Paperclip }];

export default function ChatBottombar({
  sendMessage,
}: ChatBottombarProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const setMessage = useSetAtom(messageAtom);
  const message = useAtomValue(messageAtom);
  const setHasMessage = useSetAtom(hasMessageAtom);
  const [isFocused, setIsFocused] = useState(false);
  const [staticHeight, setStaticHeight] = useState(40);
  const theme = useTheme();

  // Signal/Messenger-like colors
  const isLightMode = useColorScheme() === 'light';
  const inputBackground = isLightMode ? '#e0e0e0' : '#1E1E1E'; // Slightly darker gray for light mode
  const placeholderColor = isLightMode ? '#8E8E93' : '#8A8A8E'; // Subtle placeholder color
  const inputTextColor = theme.colors.text;

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    setHasMessage(message.trim().length > 0);
  }, [message]);

  const handleInputChange = (text: string) => {
    setMessage(text);
  };

  const inputHeight = useSharedValue(40);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: isIOS
        ? withTiming(inputHeight.value, { duration: 200 })
        : staticHeight,
    };
  });

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.inputContainer}>
        <AnimatedTextInput
          multiline
          value={message}
          onChangeText={handleInputChange}
          style={[
            styles.textInput,
            animatedStyle,
            {
              color: inputTextColor,
              backgroundColor: inputBackground,
            },
          ]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="default"
          enablesReturnKeyAutomatically={true}
          placeholder="მესიჯი"
          placeholderTextColor={placeholderColor}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          onContentSizeChange={(event) => {
            const newHeight =
              event.nativeEvent.contentSize.height + (isIOS ? 20 : 0);
            // Limit maximum height to 120px
            if (isIOS) {
              inputHeight.value = Math.min(newHeight, 120);
            } else {
              // For Android, just update the state without animation
              setStaticHeight(Math.min(newHeight, 120));
            }
          }}
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

  // Signal-like send button - blue for light mode, green for dark mode
  const sendButtonColor =
    theme.colors.background === '#FFFFFF'
      ? '#3478F6' // Signal blue for light mode
      : '#22c55e'; // Keep green for dark mode

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message.trim());
    }
  };

  return (
    <TouchableOpacity
      disabled={ !hasText}
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
