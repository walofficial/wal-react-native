import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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
      style={[styles.button, { backgroundColor: "#efefef" }]}
    >
      <Text style={styles.buttonText}>
        {isPublic ? "დამალვა" : "გამოაქვეყნე"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    width: "100%",
    padding: 16,
  },
  buttonText: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "600",
  },
});
