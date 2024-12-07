import React, { useMemo } from "react";
import { Pressable } from "react-native";
import { TaskCategory } from "@/lib/interfaces";
import { useAtom } from "jotai";
import { activeCategoryState } from "@/lib/state/category";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
  interpolateColor,
} from "react-native-reanimated";

const categoryColors: { [key: string]: string } = {
  Popular: "#ffd700",
  Gym: "#3b82f6",
  Funny: "#4ade80",
  Find: "#fdba74",
  Drinks: "#ec4899",
};

function CategoriesList({
  defaultCategoryId,
  categories,
}: {
  defaultCategoryId: string;
  categories: TaskCategory[];
}) {
  const [activeCategoryId, setActiveCategory] = useAtom(activeCategoryState);
  const currentCategoryId = useMemo(() => {
    return activeCategoryId || defaultCategoryId;
  }, [activeCategoryId, defaultCategoryId]);

  return (
    <>
      {categories.map((item, ind) => {
        const categoryTitle = item.display_name;
        const isActive = currentCategoryId === item.id;

        return (
          <CategoryButton
            key={item.id}
            isActive={isActive}
            onPress={() => setActiveCategory(item.id)}
            title={categoryTitle}
          />
        );
      })}
    </>
  );
}

interface CategoryButtonProps {
  isActive: boolean;
  onPress: () => void;
  title: string;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  isActive,
  onPress,
  title,
}) => {
  const animationValue = useSharedValue(isActive ? 1 : 0);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    animationValue.value = withTiming(isActive ? 1 : 0, { duration: 250 });
  }, [isActive]);

  const textStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animationValue.value,
      [0, 1],
      [1, 1.25],
      Extrapolate.CLAMP
    );

    const color = interpolateColor(
      animationValue.value,
      [0, 1],
      ["rgba(216, 216, 216, 1)", "rgba(255, 255, 255, 1)"]
    );

    return {
      transform: [{ scale }, { translateY: translateY.value }],
      color,
    };
  });

  const onPressIn = React.useCallback(() => {
    translateY.value = withTiming(-4, { duration: 250 });
  }, [translateY]);

  const onPressOut = React.useCallback(() => {
    translateY.value = withTiming(0, { duration: 250 });
  }, [translateY]);

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          {
            marginRight: 8,
            paddingHorizontal: 24,
            paddingVertical: 12,
          },
        ]}
      >
        <Animated.Text
          style={[
            {
              fontSize: 16,
              fontWeight: "bold",
            },
            textStyle,
          ]}
        >
          {title}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

export default CategoriesList;
