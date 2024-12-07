import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";

interface ContactListHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}

const ContactListHeader: React.FC<ContactListHeaderProps> = ({
  icon,
  title,
}) => (
  <View className="flex-row items-center mb-4">
    <Ionicons name={icon} size={24} color="white" />
    <Text className="text-xl font-semibold text-white ml-3">{title}</Text>
  </View>
);

export default ContactListHeader;
