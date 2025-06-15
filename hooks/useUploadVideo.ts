"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useAtom, useAtomValue } from "jotai";
import { verificationRefetchIntervalState } from "@/lib/state/chat";
import { useRef } from "react";
import { Alert } from "react-native";
import { toast } from "@backpackapp-io/react-native-toast";
import useAuth from "./useAuth";
import { LocationFeedPost } from "@/lib/interfaces";
import { CompressedVideo } from "@/lib/media/video/types";
import { uploadVideo } from "@/lib/media/video/upload";
import { useLocalSearchParams } from "expo-router";
import { debouncedSearchValueAtom } from "@/lib/state/search";

export const useUploadVideo = ({
  taskId,
  isPhoto,
  isLocationUpload,
}: {
  taskId: string;
  isPhoto: boolean;
  isLocationUpload: boolean;
}) => {
  const abortController = useRef<AbortController>(new AbortController());

  const queryClient = useQueryClient();
  const [refetchInterval, setRefetchInterval] = useAtom(
    verificationRefetchIntervalState
  );
  const { content_type } = useLocalSearchParams<{
    content_type: "last24h" | "youtube_only" | "social_media_only";
  }>();

  // Get the current search term to match the query key
  const currentSearchTerm = useAtomValue(debouncedSearchValueAtom);

  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const uploadBlob = useMutation({
    mutationKey: ["upload-blob", taskId, isPhoto],
    onMutate: () => {
      toast.loading("იტვირთება...", {
        id: "upload-blob",
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    mutationFn: ({
      video,
      // Form data and params have same data but params is used for optimistic update
      // Form data is only used for photos upload
      formData,
      params,
    }: {
      video?: CompressedVideo;
      formData: FormData;
      params?: {
        task_id: string;
        recording_time: number;
        text_content: string;
      };
    }) => {
      if (isPhoto) {
        return api.uploadPhotosToLocation(formData);
      }
      if (!video || !params) {
        throw new Error("Video is required");
      }

      return uploadVideo({
        video,
        setProgress: (progress) => {
          toast.loading("იტვირთება... " + Math.round(progress * 100) + "%", {
            id: "upload-blob",
          });
        },
        signal: abortController.current.signal,
        params,
      });
    },
    retry: false,
    onSuccess: (data, variables) => {
      // setStatus({
      //   status: "verification-pending",
      //   text: "ვერიფიცირდება...",
      // });

      setRefetchInterval(1000);
      toast.success("გამოქვეყნდა", {
        id: "upload-blob",
      });

      if (isLocationUpload) {
        const optimisticVerification = {
          ...data.verification,
          assignee_user: user,
        };

        // Use the correct query key that includes the search term
        const queryKey = ["location-feed-paginated", taskId, content_type, currentSearchTerm];

        try {
          queryClient.setQueryData(
            queryKey,
            (data: any) => {
              if (!data) {
                data = {
                  pages: [],
                  index: 0
                };
              }
              return {
                ...data,
                pages: data.pages.map(
                  (
                    page: {
                      data: LocationFeedPost[];
                      page: number;
                    },
                    index: number
                  ) => {
                    return index === 0
                      ? {
                        ...page,
                        data: [optimisticVerification, ...page.data],
                      }
                      : page;
                  }
                ),
              };
            }
          );
        } catch (error) {
          console.error("Optimistic update error:", error);
        }

        // Invalidate all related queries to trigger proper refetch with animations
        // Small delay to allow optimistic update to render first
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: ["location-feed-paginated", taskId],
            exact: false
          });

          // Also invalidate verification queries to ensure consistency
          queryClient.invalidateQueries({
            queryKey: ["verification-by-id"],
            exact: false
          });

          // Invalidate user verifications queries
          queryClient.invalidateQueries({
            queryKey: ["user-verifications-paginated"],
            exact: false
          });
        }, 100);
      }
    },
    onError: (error) => {
      toast.dismiss("upload-blob");
      if (error) {
        console.log("error", error);
        Alert.alert(isPhoto ? "ფოტო ვერ აიტვირთა" : "ვიდეო ვერ აიტვირთა");
      }
      console.error(error);
    },
  });

  return { uploadBlob };
};
