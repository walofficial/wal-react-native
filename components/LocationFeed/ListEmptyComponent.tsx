import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import LocationLabel from "../LocationLabel";

export function ListEmptyComponent({
  isFetching,
  isGettingLocation,
  isUserInSelectedLocation,
  selectedLocation,
  handleOpenMap,
}: {
  isFetching: boolean;
  isGettingLocation: boolean;
  isUserInSelectedLocation: boolean;
  selectedLocation: Location;
  handleOpenMap: () => void;
}) {
  if (isFetching || isGettingLocation) {
    return (
      <View className="flex-1 h-[400px] flex items-center justify-center px-4">
        <ActivityIndicator color="white" />
      </View>
    );
  }
  // if (!isUserInSelectedLocation && selectedLocation) {
  //   return (
  //     <View className="flex-1 h-[400px] flex items-center justify-center px-4">
  //       <Text className="text-white text-center text-lg mb-10">
  //         ფოსტების სანახავად საჭიროა ლოკაციაზე მისვლა
  //       </Text>
  //       <TouchableOpacity className="w-full" onPress={handleOpenMap}>
  //         <LocationLabel
  //           locationName={selectedLocation?.task.display_name}
  //           address={selectedLocation?.nearest_location.address}
  //         />
  //       </TouchableOpacity>
  //     </View>
  //   );
  if (isGettingLocation) {
    return null;
  }

  const mainView = isUserInSelectedLocation ? (
    <Text className="text-gray-400 text-center mb-6">{"არ არის ფოსტები"}</Text>
  ) : (
    <View className="flex-1 h-[400px] flex items-center justify-center px-4">
      <Text className="text-white text-center text-lg mb-10">
        გამოსაქვეყნებლად საჭიროა ლოკაციაზე მისვლა
      </Text>
      {selectedLocation &&
        selectedLocation.task &&
        selectedLocation.nearest_location && (
          <TouchableOpacity className="w-full" onPress={handleOpenMap}>
            <LocationLabel
              locationName={selectedLocation?.task.display_name}
              address={selectedLocation?.nearest_location.address}
            />
          </TouchableOpacity>
        )}
    </View>
  );

  return (
    !isFetching && (
      <View className="flex-1 h-[400px] flex items-center justify-center px-4">
        {mainView}
      </View>
    )
  );
}
