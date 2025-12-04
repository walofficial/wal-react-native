import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { FileImage, Paperclip, ArrowUp } from '@/lib/icons';
import { useAtomValue, useSetAtom } from 'jotai';
import { hasMessageAtom, messageAtom } from '@/lib/state/chat';
import { useTheme } from '@/lib/theme';

// Maximum height for ~8 lines of text (each line ~20px + padding)
const MAX_INPUT_HEIGHT = 180;
// Threshold: if text has more than 8 newlines or is very long, cap the height
const MAX_LINES = 8;
const LONG_TEXT_THRESHOLD = 400;

interface ChatBottombarProps {
  sendMessage: (newMessage: string) => void;
}

export const BottombarIcons = [{ icon: FileImage }, { icon: Paperclip }];

export default function ChatBottombar({ sendMessage }: ChatBottombarProps) {
  const setMessage = useSetAtom(messageAtom);
  const message = useAtomValue(messageAtom);
  const setHasMessage = useSetAtom(hasMessageAtom);
  const theme = useTheme();

  // Signal/Messenger-like colors
  const isLightMode = useColorScheme() === 'light';
  const inputBackground = isLightMode ? '#e0e0e0' : '#1E1E1E';
  const placeholderColor = isLightMode ? '#8E8E93' : '#8A8A8E';
  const inputTextColor = theme.colors.text;
  const backgroundColor = theme.colors.background;

  // Check if text is "too long" - either has many newlines or is very long
  const shouldLimitHeight = useMemo(() => {
    const newlineCount = (message.match(/\n/g) || []).length;
    return newlineCount >= MAX_LINES || message.length > LONG_TEXT_THRESHOLD;
  }, [message]);

  useEffect(() => {
    setHasMessage(message.trim().length > 0);
  }, [message, setHasMessage]);

  const handleInputChange = useCallback(
    (text: string) => {
      setMessage(text);
    },
    [setMessage],
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.inputContainer}>
        <TextInput
          multiline
          value={message}
          onChangeText={handleInputChange}
          style={[
            styles.textInput,
            {
              color: inputTextColor,
              backgroundColor: inputBackground,
            },
            shouldLimitHeight && { maxHeight: MAX_INPUT_HEIGHT },
          ]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="default"
          enablesReturnKeyAutomatically
          placeholder="მესიჯი"
          placeholderTextColor={placeholderColor}
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
    fontSize: 16,
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
