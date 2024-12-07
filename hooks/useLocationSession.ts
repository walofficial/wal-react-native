import { useContext } from "react";
import LocationContext from "@/hooks/context";

export default function useLocationSession() {
  const { location } = useContext(LocationContext);

  return { location };
}
