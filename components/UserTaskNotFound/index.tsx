import React from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Text } from "../ui/text";
import { Button } from "../ui/button";
import { useRouter } from "expo-router";
import useCategories from "@/hooks/useCategories";
import { toast } from "@backpackapp-io/react-native-toast";

const StepCard = ({ title, description }) => (
  <Card className="p-1 bg-black shadow-sm mb-4">
    <CardHeader className="flex-row items-start">
      {/* <Text className="text-3xl font-bold mr-4 text-pink-600">{number}</Text> */}
      <View className="flex-1">
        <CardTitle>{title}</CardTitle>
      </View>
    </CardHeader>
    {description}
  </Card>
);

function UserTaskNotFound() {
  const router = useRouter();
  const steps = [];

  const { categories, categoriesIsFetching, categoriesError } = useCategories();
  const firstCategory =
    categoriesIsFetching && !categories.length ? null : categories[0];

  return (
    <View className="mt-5">
      <StepCard
        title="დააჩელენჯე ვინმე"
        description={
          <View className="px-6 pb-8">
            <Button
              onPress={() => {
                if (!firstCategory) {
                  toast.error("სცადეთ მოგვიანებით");
                  return;
                }
                router.replace({
                  pathname: "/(dailypicks)/tasks/[categoryId]",
                  params: {
                    categoryId: firstCategory?.id,
                  },
                });
              }}
              className="w-full rounded-full shadow-lg"
              style={{
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
              }}
            >
              <Text className="text-lg font-semibold">დავალებების ნახვა</Text>
            </Button>
          </View>
        }
      />
      {steps.map((step, index) => (
        <StepCard key={index} {...step} />
      ))}
    </View>
  );
}

export default UserTaskNotFound;
