import { Link } from "expo-router";
import React, { useEffect, useRef, useState, useTransition } from "react";
import { View, TouchableOpacity, TextInput, Text } from "react-native";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { FileImage, Paperclip, Mic, ArrowUp } from "@/lib/icons";
import { Audio } from "expo-av";
import { useAtomValue, useSetAtom } from "jotai";
import { hasMessageAtom, messageAtom } from "@/lib/state/chat";
import { toast } from "@backpackapp-io/react-native-toast";

interface ChatBottombarProps {
  sendMessage: (newMessage: any) => void;
  isMobile: boolean;
  onFocus: () => void;
  onBlur: () => void;
  canText?: boolean;
}

export const BottombarIcons = [{ icon: FileImage }, { icon: Paperclip }];

export default function ChatBottombar({
  onFocus,
  canText,
  onBlur,
  sendMessage,
}: ChatBottombarProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const setMessage = useSetAtom(messageAtom);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handleInputChange = (text: string) => {
    setMessage(text);
  };

  const inputRef = useRef<TextInput>(null);
  const message = useAtomValue(messageAtom);
  const setHasMessage = useSetAtom(hasMessageAtom);

  useEffect(() => {
    setHasMessage(message.trim().length > 0);
  }, [message]);

  const handleKeyPress = ({
    nativeEvent,
  }: {
    nativeEvent: { key: string };
  }) => {
    if (nativeEvent.key === "Enter") {
      sendMessage(inputRef.current?.props.value);
    }
  };

  return (
    <View
      className={cn(
        "flex flex-row p-3 mt-5 justify-between w-full items-center",
        {
          "opacity-50": !canText,
        }
      )}
    >
      <View
        className={cn("flex flex-row justify-between flex-1 mt-4 items-center")}
      >
        <TextInput
          style={{
            height: 40,
            borderColor: "#333",
            borderWidth: 1,
            borderRadius: 20,
            paddingHorizontal: 15,
            color: "#ffffff",
            backgroundColor: "transparent",
            width: "85%",
          }}
          value={message}
          ref={inputRef}
          onKeyPress={handleKeyPress}
          onChangeText={handleInputChange}
          placeholder="მესიჯი"
          placeholderTextColor="#999999"
        />
        <SendButton canText={!!canText} sendMessage={sendMessage} />
      </View>
    </View>
  );
}

export function SendButton({
  canText,
  sendMessage,
}: {
  canText: boolean;
  sendMessage: (message: string) => void;
}) {
  const message = useAtomValue(messageAtom);
  const hasText = useAtomValue(hasMessageAtom);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message.trim());
    }
  };

  return (
    <TouchableOpacity
      disabled={!canText || !hasText}
      className={cn(
        hasText ? "opacity-100" : "opacity-55",
        "h-12 w-12 rounded-full ml-2 flex items-center justify-center",
        "dark:bg-green-500 dark:hover:bg-green-500 dark:hover:text-white"
      )}
      onPress={handleSend}
    >
      <ArrowUp color="white" size={20} />
    </TouchableOpacity>
  );
}

function ChatInput({
  canText,
  onFocus,
  onBlur,
  handleInputChange,
  handleEnterMessage,
  isPending,
}: {
  canText: boolean;
  onFocus: () => void;
  onBlur: () => void;
  handleEnterMessage: (message: string) => void;
  handleInputChange: (text: string) => void;
  isPending: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  const message = useAtomValue(messageAtom);
  const setHasMessage = useSetAtom(hasMessageAtom);

  useEffect(() => {
    setHasMessage(message.trim().length > 0);
  }, [message]);

  const handleKeyPress = ({
    nativeEvent,
  }: {
    nativeEvent: { key: string };
  }) => {
    if (nativeEvent.key === "Enter") {
      handleEnterMessage(message);
    }
  };

  if (!canText) {
    return (
      <TouchableOpacity
        onPress={() => {
          toast.error("დავალებები შესასრულებელია");
        }}
      >
        <View className="text-black min-h-12 pl-4 border-transparent !border-none dark:text-white flex flex-row items-center px-3 bg-transparent">
          <Text className="text-white">დავალებები შესასრულებელია</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Input
      autoComplete="off"
      value={message}
      ref={inputRef}
      editable={canText && !isPending}
      onKeyPress={handleKeyPress}
      onChangeText={handleInputChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={canText ? "მესიჯი" : "დავალებები შესასრულებელია"}
      className="text-black pl-4 border-transparent !border-none dark:text-white flex flex-row items-center px-3 bg-transparent"
    />
  );
}

const ChatInputAnimatedWrapper = React.memo(
  ({ children }: { children: React.ReactNode }) => {
    return (
      <View
        style={{
          flex: 1,
        }}
        className={"border-gray-600 dark:border-gray-700 border-2 rounded-full"}
      >
        {children}
      </View>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.children === nextProps.children;
  }
);

ChatInputAnimatedWrapper.displayName = "ChatInputAnimatedWrapper";
