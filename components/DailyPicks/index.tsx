import { View } from "react-native";
import React, { useEffect } from "react";
import CategoriesList from "@/components/CategoriesList/CategoriesList";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TaskCategory } from "@/lib/interfaces";
import { useLocalSearchParams } from "expo-router";
import { useAtom, useAtomValue } from "jotai";
import { activeCategoryState } from "@/lib/state/category";
import { LinearGradient } from "expo-linear-gradient";

export default function DailyPicks({
  categories,
  categoriesIsFetching,
}: {
  categories: TaskCategory[];
  categoriesIsFetching: boolean;
}) {
  const { categoryId: defaultCategoryId } = useLocalSearchParams();

  const insets = useSafeAreaInsets();
  const [activeCategoryId, setActiveCategoryId] = useAtom(activeCategoryState);

  useEffect(() => {
    setActiveCategoryId(defaultCategoryId as string);
  }, [defaultCategoryId]);
  const currentCategory = activeCategoryId || defaultCategoryId;

  // useEffect(() => {
  //   if (currentCategory && categories.length > 0) {
  //     const categoryIndex = categories.findIndex(
  //       (cat) => cat.id === currentCategory
  //     );
  //     if (categoryIndex !== -1 && scrollViewRef.current) {
  //       scrollViewRef.current.scrollTo({
  //         x: categoryIndex * 100,
  //         animated: true,
  //       });
  //     }
  //   }
  // }, [currentCategory, categories]);

  return (
    <LinearGradient
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom || 20,
      }}
      colors={["rgba(0,0,0,0.8)", "transparent"]}
    >
      {/* <UserSelectedTask /> */}
      {/* <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 20 }}
      > */}
      <View className="flex flex-row justify-center items-center">
        <CategoriesList
          defaultCategoryId={currentCategory as string}
          categories={categories}
        />
      </View>

      {/* </ScrollView> */}
    </LinearGradient>
  );
}
