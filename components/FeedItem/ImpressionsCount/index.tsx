import { Text, View } from "react-native";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import ApiClient from "@/lib/api";
import { useTheme } from "@/lib/theme";

interface ImpressionsCountProps {
  verificationId: string;
}

function ImpressionsCount({ verificationId }: ImpressionsCountProps) {
  const theme = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: ["impressions", verificationId],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: () => ApiClient.getVerificationImpressions(verificationId),
  });

  if (isLoading) return null;

  const impressionsCount = data?.impressions_count ?? 0;
  if (impressionsCount === 0) return null;

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text
        style={[{ marginLeft: 5, color: theme.colors.feedItem.secondaryText }]}
      >
        {impressionsCount} ნახვა
      </Text>
    </View>
  );
}

export default ImpressionsCount;
