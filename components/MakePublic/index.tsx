import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useMakePublicMutation } from "@/hooks/useMakePublicMutation";
import { toast } from "@backpackapp-io/react-native-toast";

export default function MakePublic({
  verificationId,
  defaultValue,
}: {
  verificationId: string;
  defaultValue?: boolean;
}) {
  const [isPublic, setIsPublic] = useState(defaultValue);
  const mutation = useMakePublicMutation(verificationId);

  const handleToggle = () => {
    const newValue = !isPublic;
    setIsPublic(newValue);
    mutation.mutate(newValue, {
      onError: () => {
        setIsPublic(!newValue);
      },
      onSuccess: () => {
        toast.success(newValue ? "გამოაქვეყნებულია" : "დაიმალა");
      },
    });
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={{ backgroundColor: "#efefef" }}
      className="flex flex-row rounded-xl justify-center items-center shadow-pink-600 mt-3 w-full shadow-sm p-4"
    >
      <Text className="text-black text-xl font-semibold">
        {isPublic ? "დამალვა" : "გამოაქვეყნე"}
      </Text>
    </TouchableOpacity>
  );
}
