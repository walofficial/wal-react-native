import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { XIcon } from "@/lib/icons";
import { ArrowLeft } from "lucide-react-native";

export default function CloseButton({
  onClick,
  variant = "x",
}: {
  onClick?: () => void;
  variant?: "x" | "back";
}) {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="p-2"
      onPress={() => {
        if (onClick) {
          onClick();
        } else {
          router.back();
        }
      }}
    >
      {variant === "x" ? (
        <XIcon color={"#efefef"} size={35} />
      ) : (
        <ArrowLeft color={"#efefef"} size={35} />
      )}
    </TouchableOpacity>
  );
}
