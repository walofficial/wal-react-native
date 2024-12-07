import { TaskCategoryName } from "../interfaces";
import { Dumbbell } from "./Dumbbell";
import { Laugh } from "./Laugh";
import { Search } from "./Search";
import { Martini } from "./Martini";
import { StarIcon } from "./StarIcon";

export const renderCategoryIcons = (category_name: TaskCategoryName) => {
  switch (category_name) {
    case "Gym":
      return <Dumbbell className="mr-4" color={"#3b82f6"} height={30} />;
    case "Funny":
      return <Laugh className="mr-4" color={"#4ade80"} />;
    case "Find":
      return <Search className="mr-4" color={"#fdba74"} size={25} />;
    case "Drinks":
      return <Martini className="mr-4" color="#ec4899" size={25} />;
    case "Popular":
      return <StarIcon className="mr-4 shrink-0" color="#ffd700" size={25} />;
    default:
      return null;
  }
};
