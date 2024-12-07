import { Text, View } from "react-native";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import ApiClient from "@/lib/api";

interface ImpressionsCountProps {
  verificationId: string;
}

function ImpressionsCount({ verificationId }: ImpressionsCountProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["impressions", verificationId],
    queryFn: () => ApiClient.getVerificationImpressions(verificationId),
  });

  if (isLoading) return null;

  const impressionsCount = data?.impressions_count ?? 0;
  if (impressionsCount === 0) return null;

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={[{ marginLeft: 5 }]} className="text-gray-300">
        {impressionsCount} ნახვა
      </Text>
    </View>
  );
}

export default ImpressionsCount;
