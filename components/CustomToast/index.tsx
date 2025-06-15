import { Toasts } from "@backpackapp-io/react-native-toast";
import { useColorScheme } from "react-native";

function CustomToast() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Apple Human Interface Guidelines inspired styling
  const lightModeStyle = {
    view: {
      backgroundColor: "rgba(248, 248, 248, 0.95)",
      borderRadius: 10,
      padding: 16,
    },
    text: {
      fontSize: 15,
      fontWeight: "500" as const,
      color: "#000000",
    },
  };

  const darkModeStyle = {
    view: {
      backgroundColor: "black",
      borderWidth: 1,
      borderColor: "#333",
      elevation: 5,
      borderRadius: 8,
      padding: 12,
    },
    text: {
      fontWeight: "bold",
      fontSize: 16,
      color: "white",
    },
  };

  return <Toasts defaultStyle={isDarkMode ? darkModeStyle : lightModeStyle} />;
}

export default CustomToast;
