import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import api from "@/lib/api";
import { CirclePlus, CheckIcon, XIcon } from "@/lib/icons";
import { useMutation } from "@tanstack/react-query";
import ImageLoader from "@/components/ImageLoader";
import useUser from "@/hooks/useAuth";
import { authUser } from "@/lib/state/auth";
import { useSetAtom } from "jotai";
import { cx } from "class-variance-authority";
import * as ImageManipulator from "expo-image-manipulator";
import { ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { toast } from "@backpackapp-io/react-native-toast";
import { convertToCDNUrl } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

const maxPlaceholders = 1;

const formSchema = z.object({
  photos: z.array(
    z.object({
      blur_hash: z.string(),
      image_id: z.string(),
      image_url: z.array(z.string()),
    })
  ),
  isPhotosHidden: z.boolean(),
});

type PhotoItem = z.infer<typeof formSchema>["photos"][0];

export default function Photos({ redirectURL }: { redirectURL?: string }) {
  const { user } = useUser();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const setAuthUser = useSetAtom(authUser);
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = React.useMemo(() => ["25%"], []);

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
      photos: user.photos || [],
      isPhotosHidden: user.is_photos_hidden || false,
    },
    reValidateMode: "onChange",
  });

  const photos = watch("photos");
  const isPhotosHidden = watch("isPhotosHidden");

  const updateUserMutation = useMutation({
    onMutate: ({ photos, isPhotosHidden }) => {
      setAuthUser({
        ...user,
        photos,
        isPhotosHidden,
      });
    },
    mutationFn: (values: z.infer<typeof formSchema>) => {
      return api.updateUser({
        ...values,
        photos: photos.length === 1 ? values.photos : undefined,
      });
    },
    onSuccess: () => {
      if (redirectURL) {
        const defaultCategoryId = "66e82cbf6cf36789fa525eaf";

        router.replace({
          pathname: redirectURL as any,
          params: {
            categoryId: defaultCategoryId,
          },
        });
      } else {
        toast.success("ფოტო შეცვლილია");
      }
    },
    onError: (error) => {
      Alert.alert("ხარვეზი", "ვერ მოხერხდა მომხმარებლის განახლება");
    },
  });

  const placeholders = Array.from(
    { length: maxPlaceholders - photos.length },
    (_, i) => ({ placeholder: true })
  );

  const renderBackdrop = useCallback(
    (props) => (
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
        [{ resize: { width: 400, height: 400 } }], // Square aspect ratio for profile photo
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
      // Replace existing photo with new one
      setValue("photos", data.uploaded);
      trigger("photos");
      setLoadingIndex(null);
      bottomSheetRef.current?.close();
    },
    onError: (error) => {
      console.log(JSON.stringify(error));
      Alert.alert("ხარვეზი", "Error uploading photos");
      setLoadingIndex(null);
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
      aspect: [1, 1], // Square aspect ratio for profile photo
      quality: 1,
    });

    if (!result.canceled) {
      setLoadingIndex(0);
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

  const handlePickImage = async () => {
    bottomSheetRef.current?.close();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile photo
      quality: 1,
    });

    if (!result.canceled) {
      setLoadingIndex(0);
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
      <View className="flex-1 flex mt-4 w-full">
        <View className="flex items-center justify-center">
          <Text className="text-xl mb-4">პროფილის ფოტო</Text>
        </View>
        <View
          className="flex flex-1 items-center justify-center"
          style={{ minHeight: 200, width: "100%" }}
        >
          {[...photos, ...placeholders].map(
            (item: PhotoItem | { placeholder: boolean }, index) => {
              const itemComponent = (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    bottomSheetRef.current?.snapToIndex(0);
                  }}
                  style={{
                    width: 200,
                    height: 200,
                    overflow: "hidden",
                    borderRadius: 100, // Make it circular
                  }}
                  className={cx(
                    "flex items-center justify-center relative cursor-pointer",
                    {
                      "border-2 border-dotted border-gray-400":
                        "placeholder" in item,
                    }
                  )}
                >
                  {"image_url" in item && !isPhotosHidden ? (
                    <ImageLoader
                      aspectRatio={1} // Square aspect ratio
                      alt="Profile Photo"
                      source={convertToCDNUrl(item.image_url[0])}
                      blurhash={item.blur_hash}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <>
                      {uploadMutation.isPending && loadingIndex === index ? (
                        <ActivityIndicator size="large" />
                      ) : (
                        <View className="flex items-center">
                          <Ionicons
                            name="person-circle-outline"
                            size={70}
                            color="gray"
                          />
                          <Text className="text-gray-500 mt-2">გამოტოვება</Text>
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );

              if ("image_id" in item) {
                return (
                  <Controller
                    key={item.image_id || `placeholder-${index}`}
                    control={control}
                    name={`photos.${index}`}
                    render={({ field }) => itemComponent}
                  />
                );
              }
              return itemComponent;
            }
          )}
        </View>

        <View className="mt-5 flex flex-row items-center justify-center">
          <Button
            disabled={updateUserMutation.isPending}
            className="flex flex-row"
            onPress={handleSubmit(onSubmit)}
            size="lg"
          >
            <CheckIcon color={"black"} className="mr-2 h-4 w-4" />
            <Text>{photos.length === 1 ? "შენახვა" : "გამოტოვება"}</Text>
          </Button>
        </View>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        backdropComponent={renderBackdrop}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{
          backgroundColor: "black",
        }}
      >
        <View className="flex-1 px-4 py-2">
          <TouchableOpacity
            onPress={handleTakePhoto}
            className="py-4 flex-row items-center"
          >
            <Ionicons name="camera-outline" size={24} color="white" />
            <Text className="ml-4 text-white text-lg">კამერა</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePickImage}
            className="py-4 flex-row items-center"
          >
            <Ionicons name="images-outline" size={24} color="white" />
            <Text className="ml-4 text-white text-lg">ატვირთე გალერიიდან</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  );
}
