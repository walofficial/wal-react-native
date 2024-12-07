"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useAtom } from "jotai";
import { verificationRefetchIntervalState } from "@/lib/state/chat";
import { useRef } from "react";
import { verificationStatusState } from "@/components/VerificationStatusView/atom";
import { Alert } from "react-native";
import { toast } from "@backpackapp-io/react-native-toast";
import useAuth from "./useAuth";
import { PublicVerification } from "@/lib/interfaces";
import { convertToCDNUrl } from "@/lib/utils";

export const useUploadVideo = ({
  taskId,
  isPhoto,
  isLocationUpload,
}: {
  taskId: string;
  isPhoto: boolean;
  isLocationUpload: boolean;
}) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useAtom(verificationStatusState);
  const [refetchInterval, setRefetchInterval] = useAtom(
    verificationRefetchIntervalState
  );
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const uploadBlob = useMutation({
    mutationKey: ["upload-blob", taskId, isPhoto],
    onMutate: () => {
      toast.loading("იტვირთება...", {
        id: "upload-blob",
      });
      clearTimeout(timeoutRef.current);
    },
    mutationFn: ({
      formData,
      uriPath,
    }: {
      formData: FormData;
      uriPath: string;
    }) => {
      const photoUploadEndpoint = isLocationUpload
        ? api.uploadPhotosToLocation
        : api.verifyPhotos;
      const videoUploadEndpoint = isLocationUpload
        ? api.uploadVideosToLocation
        : api.verifyVideo;
      if (isPhoto) {
        return photoUploadEndpoint(formData);
      }

      return videoUploadEndpoint(formData, (progressPercent: number) => {
        setStatus({
          percentage: progressPercent,
          status: isPhoto ? "photo-uploading" : "video-uploading",
          text: "იტვირთება" + ` (${progressPercent.toFixed(0)}%)`,
        });

        if (progressPercent === 100) {
          setStatus({
            status: "verification-pending",
            text: "ვერიფიცირდება...",
          });
        }
      });
    },
    retry: false,
    onSuccess: (data, variables) => {
      setStatus({
        status: "verification-pending",
        text: "ვერიფიცირდება...",
      });

      setRefetchInterval(1000);
      toast.success("გამოქვეყნდა", {
        id: "upload-blob",
      });

      // timeoutRef.current = setTimeout(() => {
      //   setRefetchInterval(undefined);
      // }, 90000);
      if (isLocationUpload) {
        const optimisticVerification = {
          ...data.verification,
        };
        try {
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
                          data: [optimisticVerification, ...page.data],
                        }
                      : page;
                  }
                ),
              };
            }
          );
        } catch (error) {
          console.error("page", error);
        }
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
