import { Toasts } from "@backpackapp-io/react-native-toast";

function CustomToast() {
  return (
    <Toasts
      overrideDarkMode={false}
      defaultStyle={{
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
      }}
    />
  );
}

export default CustomToast;
