import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PublicVerification } from "@/lib/interfaces";
import { toast } from "@backpackapp-io/react-native-toast";

const MAX_CHARS = 300;

export default function CreatePost() {
  const [text, setText] = useState("");
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        throw new Error("Post cannot be empty");
      }
      return api.publishPost(taskId, trimmedText);
    },
    onSuccess: (publishedDoc) => {
      queryClient.setQueryData(
        ["location-feed-paginated", taskId],
        (data: any) => {
          return {
            ...data,
            pages: data.pages.map(
              (
                page: {
                  data: PublicVerification[];
                  page: number;
                },
                index: number
              ) => {
                return index === 0
                  ? {
                      ...page,
                      data: [publishedDoc, ...page.data],
                    }
                  : page;
              }
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["locationFeed", taskId] });
      // toast.success("პოსტი წარმატებით გამოქვეყნდა");
      router.back();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "პოსტი ვერ გამოქვეყნდა"
      );
    },
  });

  const insets = useSafeAreaInsets();
  const charactersLeft = MAX_CHARS - text.length;

  const handlePublish = () => {
    if (text.trim().length === 0) {
      toast.error("Post cannot be empty");
      return;
    }
    mutate();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black"
    >
      <StatusBar style="light" />
      <View
        className="flex-1 px-4"
        style={{
          paddingTop: insets.top + 14,
        }}
      >
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="px-4 py-2">
            <Text className="text-white text-lg">გაუქმება</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={text.trim().length === 0 || isPending}
            onPress={handlePublish}
            className={`px-4 py-2 rounded-full bg-blue-500/90 ${
              text.trim().length === 0 || isPending ? "opacity-50" : ""
            }`}
          >
            <Text className="text-white text-lg">
              {isPending ? "ქვეყნდება..." : "გამოქვეყნება"}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          className="text-white text-lg"
          placeholder="აბაა?"
          placeholderTextColor="#666"
          multiline
          maxLength={MAX_CHARS}
          value={text}
          onChangeText={setText}
          autoFocus
        />

        <Text className="text-gray-500 text-sm absolute bottom-8 right-4">
          {charactersLeft}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
