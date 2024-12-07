import { View } from "react-native";
import { H3 } from "../ui/typography";

export const SectionHeader = ({
  icon: Icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => (
  <View className="flex flex-row items-center justify-start mb-6">
    {Icon}
    <H3 className="ml-4">{text}</H3>
  </View>
);
