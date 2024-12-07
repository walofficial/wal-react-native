import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { TaskCategory } from "@/lib/interfaces";
import { renderCategoryIcons } from "@/lib/icons/renderCategoryIcons";
import { Text } from "../ui/text";
import { Link } from "expo-router";
import { Skeleton } from "../ui/skeleton";

function HorizontalCategoriesList({
  isFetching,
  categories,
  onClick,
}: {
  isFetching: boolean;
  categories: TaskCategory[];
  onClick: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
    >
      {isFetching
        ? Array.from({ length: 5 }).map((_, index) => (
            <TouchableOpacity
              key={index}
              className="flex flex-col items-center justify-center border border-input rounded-md p-2 mr-2 w-20 h-20"
              onPress={() => {}}
            >
              <Skeleton className="w-10 h-10 rounded-full" />
            </TouchableOpacity>
          ))
        : categories.map((item: TaskCategory) => {
            const categoryTitle = item.display_name;

            return (
              <Link key={item.id} href={`/tasks/${item.id}`} asChild>
                <TouchableOpacity
                  className="flex flex-col items-center justify-center border border-input rounded-md p-3 mr-2 min-w-24 h-22"
                  onPress={() => {
                    onClick(item.id);
                  }}
                >
                  {renderCategoryIcons(item.title, "small")}
                  <Text
                    className="text-white text-lg mt-1 text-center"
                    numberOfLines={1}
                  >
                    {categoryTitle}
                  </Text>
                </TouchableOpacity>
              </Link>
            );
          })}
    </ScrollView>
  );
}

export default HorizontalCategoriesList;
