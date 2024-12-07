import { cn } from "@/lib/utils";
import { View } from "react-native";
import { Large } from "../ui/typography";
import { colors } from "@/lib/colors";

function MessageItemLayout({
  isAuthor,
  children,
}: {
  isAuthor: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      className={cn(
        "flex flex-col px-3 py-1 max-w-[80%]",
        isAuthor ? "items-end self-end" : "items-start self-start"
      )}
    >
      <View
        style={{
          borderRadius: 10,
          borderTopRightRadius: isAuthor ? 0 : 10,
          borderTopLeftRadius: isAuthor ? 10 : 0,
          borderBottomRightRadius: isAuthor ? 0 : 10,
          borderBottomLeftRadius: isAuthor ? 10 : 0,
          borderWidth: 1,
          backgroundColor: isAuthor ? "#1F8AFF" : "#333",
        }}
        className={cn("rounded-2xl px-3 py-2 text-white")}
      >
        {children}
      </View>
    </View>
  );
}

export default MessageItemLayout;
