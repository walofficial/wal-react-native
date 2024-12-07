import React from "react";
import { View, TouchableOpacity } from "react-native";

const StoryButtonPlaceholder = () => {
  return (
    <TouchableOpacity className=" dark:bg-muted rounded-full">
      <View
        style={{
          height: 61,
          width: 61,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 61 / 2,
        }}
        className={" rounded-full overflow-hidden"}
      ></View>
    </TouchableOpacity>
  );
};

export default StoryButtonPlaceholder;
