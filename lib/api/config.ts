import * as Updates from "expo-updates";
import { isWeb } from "../platform";

export const isDev =
  process.env.EXPO_PUBLIC_IS_DEV === "true" &&
  Updates.channel !== "preview" &&
  Updates.channel !== "production";

export const API_BASE_URL = isWeb
  ? "http://localhost:5500"
  : (process.env.EXPO_PUBLIC_API_URL as string);
