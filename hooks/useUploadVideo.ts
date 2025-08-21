"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAtom, useAtomValue } from "jotai";
import { verificationRefetchIntervalState } from "@/lib/state/chat";
import { useRef } from "react";
import { Alert } from "react-native";
import { toast } from "@backpackapp-io/react-native-toast";
import useAuth from "./useAuth";
import { LocationFeedPost, UploadToLocationResponse } from "@/lib/api/generated";
import { CompressedVideo } from "@/lib/media/video/types";
import { uploadVideo } from "@/lib/media/video/upload";
import { useLocalSearchParams } from "expo-router";
import { debouncedSearchValueAtom } from "@/lib/state/search";
import {
  uploadPhotoToLocationVerifyPhotosUploadToLocationPostMutation,
  getLocationFeedPaginatedInfiniteOptions
} from "@/lib/api/generated/@tanstack/react-query.gen";
import { formDataBodySerializer } from "@/lib/utils/form-data";
import { useToast } from "@/components/ToastUsage";
import { t } from "@/lib/i18n";

export const useUploadVideo = ({
  feedId,
  isPhoto,
  isLocationUpload,
}: {
  feedId: string;
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
  const { success } = useToast()

  const uploadBlob = useMutation({
    mutationKey: ["upload-blob", feedId, isPhoto],
    onMutate: () => {
      success({ title: t("common.uploading") })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    mutationFn: ({
      video,
      photo,
      // Form data and params have same data but params is used for optimistic update
      // Form data is only used for photos upload
      params,
    }: {
      video?: CompressedVideo;
      photo: any;
      params?: {
        feed_id: string;
        recording_time: number;
        text_content: string;
      };
    }) => {
      if (isPhoto) {
        // Two flows exist in generated API: batch upload `/upload-photos` and upload-to-location
        // Here we assume single photo to location
        return (uploadPhotoToLocationVerifyPhotosUploadToLocationPostMutation().mutationFn as any)({
          ...formDataBodySerializer,
          body: {
            // formData contains file under key `photo_file` already
            // But generated client expects body with Blob/File. We pass formData directly if client supports it.
            // If not, upstream should adapt. Here we forward as is.
            // @ts-ignore
            photo_file: photo,
            feed_id: feedId,
          },
        });

      }
      if (!video || !params) {
        throw new Error("Video is required");
      }

      return uploadVideo({
        video,
        setProgress: (progress) => {
          success({ title: t("common.uploading") + " " + Math.round(progress * 100) + "%" })
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
      success({ title: "გამოქვეყნდა" })

      if (isLocationUpload) {
        const optimisticVerification = {
          ...(data as UploadToLocationResponse).verification,
          assignee_user: user,
        };

        // Use the correct query key that includes the search term
        const queryOptions = getLocationFeedPaginatedInfiniteOptions({
          query: {
            page_size: 15,
            search_term: currentSearchTerm,
            content_type_filter: content_type,
          },
          path: {
            feed_id: feedId,
          },
        })

        const queryKey = queryOptions.queryKey


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
          const queryOptions = getLocationFeedPaginatedInfiniteOptions({
            query: {
              page_size: 15,
              search_term: '',
              content_type_filter: 'last24h',
            },
            path: {
              feed_id: feedId,
            },
          })

          queryClient.invalidateQueries({ queryKey: queryOptions.queryKey, exact: false });
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
