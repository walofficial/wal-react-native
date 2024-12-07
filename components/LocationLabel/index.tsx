import { View } from "react-native";
import IonIcon from "react-native-vector-icons/Ionicons";
import { colors } from "@/lib/colors";
import { Text } from "@/components/ui/text";

function LocationLabel({
  locationName = "",
  address = "",
}: {
  locationName?: string;
  address?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderRadius: 9999,
        paddingHorizontal: 24,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
      }}
    >
      <IonIcon name="navigate-outline" color={colors.blue} size={24} />
      <View style={{ marginLeft: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
          {locationName}
        </Text>
        <Text style={{ fontSize: 14, color: "#D1D5DB" }}>{address}</Text>
      </View>
    </View>
  );
}

export default LocationLabel;
