import React, { useRef, useState, useCallback, memo } from "react";
import { View, TouchableOpacity, Alert, StyleSheet } from "react-native";
import Button from "@/components/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import api from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ImageLoader from "@/components/ImageLoader";
import { cx } from "class-variance-authority";
import * as ImageManipulator from "expo-image-manipulator";
import { ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { toast } from "@backpackapp-io/react-native-toast";
import { convertToCDNUrl } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import {
  bottomSheetBackgroundStyle,
  getBottomSheetBackgroundStyle,
} from "@/lib/styles";
import useAuth from "@/hooks/useAuth";
import { FontSizes, useTheme } from "@/lib/theme";

const formSchema = z.object({
  photo: z
    .object({
      blur_hash: z.string(),
      image_id: z.string(),
      image_url: z.array(z.string()),
    })
    .optional(),
  isPhotosHidden: z.boolean(),
});

type PhotoItem = z.infer<typeof formSchema>["photo"];

export default function Photos({ redirectURL }: { redirectURL?: string }) {
  const { user, setAuthUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = React.useMemo(() => ["25%"], []);
  const theme = useTheme();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      photo: user?.photos?.[0] || undefined,
      isPhotosHidden: user!.is_photos_hidden || false,
    },
    reValidateMode: "onChange",
  });

  const photo = watch("photo");
  const isPhotosHidden = watch("isPhotosHidden");

  const updateUserMutation = useMutation({
    onMutate: ({ photo, isPhotosHidden }) => {
      setAuthUser({
        ...user,
        photos: photo ? [photo] : [],
        isPhotosHidden,
      });
    },
    mutationFn: (values: z.infer<typeof formSchema>) => {
      return api.updateUser({
        photos: values.photo ? [values.photo] : [],
        isPhotosHidden: values.isPhotosHidden,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({
        queryKey: ["user-verifications-paginated"],
      });

      if (redirectURL) {
        const defaultCategoryId = "66e82cbf6cf36789fa525eaf";

        router.replace({
          pathname: redirectURL as any,
          params: {
            categoryId: defaultCategoryId,
          },
        });
      } else {
        router.back();
      }
    },
    onError: (error) => {
      Alert.alert("ხარვეზი", "ვერ მოხერხდა მომხმარებლის განახლება");
    },
  });

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const resizeImage = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error("Error resizing image", error);
      return null;
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.uploadPhotos(formData);
    },
    onSuccess: (data) => {
      setValue("photo", data.uploaded[0]);
      trigger("photo");
      setIsLoading(false);
      bottomSheetRef.current?.close();

      const formData = {
        photo: data.uploaded[0],
        isPhotosHidden: isPhotosHidden,
      };
      updateUserMutation.mutate(formData);
    },
    onError: (error) => {
      console.log(JSON.stringify(error));
      Alert.alert("ხარვეზი", "Error uploading photos");
      setIsLoading(false);
    },
  });

  const handleTakePhoto = async () => {
    bottomSheetRef.current?.close();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setIsLoading(true);
      const resizedUri = await resizeImage(result.assets[0].uri);
      if (resizedUri) {
        const formData = new FormData();
        formData.append("files", {
          uri: resizedUri,
          name: "profile99",
          type: "image/jpeg",
        } as any);
        uploadMutation.mutate(formData);
      }
    }
  };

  const sheetBackgroundStyle = getBottomSheetBackgroundStyle();
  const handlePickImage = async () => {
    bottomSheetRef.current?.close();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setIsLoading(true);
      const resizedUri = await resizeImage(result.assets[0].uri);
      if (resizedUri) {
        const formData = new FormData();
        formData.append("files", {
          uri: resizedUri,
          name: "profile99",
          type: "image/jpeg",
        } as any);
        uploadMutation.mutate(formData);
      }
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!isValid) return;
    updateUserMutation.mutate(values);
  };

  return (
    <>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            პროფილის ფოტო
          </Text>
        </View>
        <View style={styles.photosContainer}>
          <TouchableOpacity
            onPress={() => {
              bottomSheetRef.current?.snapToIndex(0);
            }}
            style={[
              styles.photoButton,
              !photo && styles.placeholderButton,
              !photo && {
                borderColor: theme.colors.border,
              },
            ]}
          >
            {photo && !isPhotosHidden ? (
              <ImageLoader
                aspectRatio={1}
                alt="Profile Photo"
                source={convertToCDNUrl(photo.image_url[0])}
                blurhash={photo.blur_hash}
                style={styles.image}
              />
            ) : (
              <View style={styles.placeholderContent}>
                <Ionicons
                  name="person-circle-outline"
                  size={70}
                  color={theme.colors.icon}
                />
              </View>
            )}

            {/* Loading overlay */}
            {(isLoading ||
              uploadMutation.isPending ||
              updateUserMutation.isPending) && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        backdropComponent={renderBackdrop}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={sheetBackgroundStyle}
      >
        <View style={styles.bottomSheetContent}>
          <TouchableOpacity
            onPress={handleTakePhoto}
            style={styles.bottomSheetButton}
          >
            <Ionicons
              name="camera-outline"
              size={24}
              color={theme.colors.icon}
            />
            <Text
              style={[
                styles.bottomSheetButtonText,
                { color: theme.colors.text },
              ]}
            >
              კამერა
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePickImage}
            style={styles.bottomSheetButton}
          >
            <Ionicons
              name="images-outline"
              size={24}
              color={theme.colors.icon}
            />
            <Text
              style={[
                styles.bottomSheetButtonText,
                { color: theme.colors.text },
              ]}
            >
              ატვირთე გალერიიდან
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 16,
    width: "100%",
  },
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 20,
    marginBottom: 16,
  },
  photosContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    width: "100%",
  },
  photoButton: {
    width: 200,
    height: 200,
    overflow: "hidden",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  placeholderButton: {
    borderWidth: 2,
    borderStyle: "dotted",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderContent: {
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    width: "100%",
    borderRadius: 12,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bottomSheetButton: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  bottomSheetButtonText: {
    marginLeft: 16,
    fontSize: FontSizes.medium,
  },
});
