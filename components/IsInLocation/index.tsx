import React, { useState, useEffect } from "react";
import * as Location from "expo-location";
import { Text } from "@/components/ui/text";
import { Dimensions, Platform, TouchableOpacity, View } from "react-native";
import StaticSafeAreaInsets from "react-native-static-safe-area-insets";
import useCheckLocation from "@/hooks/useCheckLocation";
import { openMap } from "@/utils/openMap";
import { SAFE_AREA_PADDING } from "../CameraPage/Constants";
import IonIcon from "react-native-vector-icons/Ionicons";
import { Large } from "../ui/typography";
import { toast } from "@backpackapp-io/react-native-toast";
import { colors } from "@/lib/colors";
import { useRouter } from "expo-router";
import { isDev } from "@/lib/api/config";
import LocationLabel from "../LocationLabel";
function IsInLocation({
  onCheckLocation,
  taskId,
}: {
  onCheckLocation: (isInLocation: boolean) => void;
  taskId: string;
}) {
  const [cords, setCords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const router = useRouter();
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);

  const { isInLocation, nearestLocation, isError, isSuccess, isFetching } =
    useCheckLocation(taskId, cords?.latitude ?? 0, cords?.longitude ?? 0);
  useEffect(() => {
    if (isSuccess && !nearestLocation) {
      onCheckLocation(true);
    } else if (isSuccess && nearestLocation) {
      onCheckLocation(isDev ? true : isInLocation);
    }
  }, [isInLocation, nearestLocation, isSuccess]);
  const loadingDataAndFirstLocation =
    (isGettingLocation || isFetching) && showLoadingIndicator;

  useEffect(() => {
    if (isError) {
      toast.error("სამწუხაროდ მისამართის შემოწმება ვერ მოხერხდა", {
        id: "is-in-location",
      });
      return;
    }

    if (!isFetching && isInLocation) {
      toast.success("თქვენ ხართ ლოკაციაზე", {
        id: "is-in-location-success2",
        duration: 3000,
      });
      toast.remove("is-in-location");
    }
  }, [isError, isFetching, isInLocation]);

  useEffect(() => {
    return () => {
      toast.remove();
    };
  }, []);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [status, requestPermission] = Location.useForegroundPermissions();

  const handleOpenMap = () => {
    if (nearestLocation?.coordinates && nearestLocation?.name) {
      openMap(nearestLocation.coordinates, nearestLocation.name);
    }
  };

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let timeoutId: NodeJS.Timeout;

    (async () => {
      if (!status || !status.granted) {
        const { status: newStatus } = await requestPermission();
        if (newStatus !== "granted") {
          setErrorMsg(
            "საჭიროა ლოკაციაზე ინფორმაციის მიღებაზე დართოთ აპლიკაციას ნებართვა"
          );
          setIsGettingLocation(false);
          return;
        }
      }
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 500,
        },
        (location) => {
          setCords({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setIsGettingLocation(false);
        }
      );

      // Set a timeout to show the loading indicator after 3 seconds
      timeoutId = setTimeout(() => {
        setShowLoadingIndicator(true);
      }, 3000);
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      clearTimeout(timeoutId);
    };
  }, [status, requestPermission]);

  const renderLocationText = () => {
    if (errorMsg) {
      return (
        <Large className="text-red-400 text-lg text-center font-semibold mb-2">
          {errorMsg}
        </Large>
      );
    }
    if (isError) {
      return (
        <Large className="text-red-400 text-lg text-center font-semibold mb-2">
          სამწუხაროდ მისამართის შემოწმება ვერ მოხერხდა
        </Large>
      );
    }
    if (!nearestLocation) return null;
    if (!isInLocation) {
      return (
        <View className="bg-white rounded-xl shadow-lg p-4 py-8 m-2">
          <Text className="text-left text-blue-500 text-xl animate-pulse font-semibold mb-2">
            ვამოწმებთ თქვენს მისამართს...
          </Text>
          <View className="flex flex-row items-center">
            <IonIcon name="camera" color={colors.gray} size={24} />
            <Text className="text-left text-black ml-3">
              გადასაღებად საჭიროა ლოკაციაზე მისვლა
            </Text>
          </View>
        </View>
      );
    }
  };

  return (
    <View
      style={[
        {
          position: "absolute",
          top: 0,
          opacity: 1,
          left: 0,
          paddingHorizontal: 15,
          paddingBottom: 30,
          paddingTop:
            StaticSafeAreaInsets.safeAreaInsetsTop +
            (Platform.OS === "android" ? 30 : 10),
          width: "100%",
          height:
            Platform.OS === "ios" ? Dimensions.get("window").height : "100%",
          zIndex: 1,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    >
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          padding: 16,
        }}
        onPress={() => {
          toast.remove();
          router.back();
        }}
      >
        <IonIcon name="arrow-back" color="white" size={24} />
      </TouchableOpacity>
      <View className="">{renderLocationText()}</View>
      {nearestLocation && (
        <TouchableOpacity
          style={[
            {
              position: "absolute",
              alignSelf: "center",
              bottom: SAFE_AREA_PADDING.paddingBottom,
              opacity: loadingDataAndFirstLocation ? 0 : 1,
              pointerEvents: loadingDataAndFirstLocation ? "none" : "auto",
            },
          ]}
          className="flex flex-row justify-center items-center mt-3 w-full p-4"
          onPress={handleOpenMap}
        >
          <LocationLabel
            locationName={nearestLocation?.name}
            address={nearestLocation?.address}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default IsInLocation;
