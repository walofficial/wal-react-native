import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/colors";
import { Text } from "@/components/ui/text";

interface LocationLabelProps {
  locationName?: string;
  address?: string;
}

function LocationLabel({
  locationName = "",
  address = "",
}: LocationLabelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="navigate-outline" color={colors.blue} size={24} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.locationName}>{locationName}</Text>
        {address && <Text style={styles.address}>{address}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#374151",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    marginLeft: 16,
  },
  locationName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  address: {
    fontSize: 14,
    color: "#D1D5DB",
  },
});

export default LocationLabel;
