import { StyleSheet } from "react-native";
import { TaskCategoryName } from "../interfaces";
import { Dumbbell } from "./Dumbbell";
import { Laugh } from "./Laugh";
import { Search } from "./Search";
import { Martini } from "./Martini";
import { StarIcon } from "./StarIcon";

export const renderCategoryIcons = (category_name: TaskCategoryName) => {
  switch (category_name) {
    case "Gym":
      return <Dumbbell style={styles.icon} color={"#3b82f6"} height={30} />;
    case "Funny":
      return <Laugh style={styles.icon} color={"#4ade80"} />;
    case "Find":
      return <Search style={styles.icon} color={"#fdba74"} size={25} />;
    case "Drinks":
      return <Martini style={styles.icon} color="#ec4899" size={25} />;
    case "Popular":
      return <StarIcon style={styles.iconShrink} color="#ffd700" size={25} />;
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  icon: {
    marginRight: 16,
  },
  iconShrink: {
    marginRight: 16,
    flexShrink: 0,
  },
});
