import * as Updates from "expo-updates";

export const isDev =
  process.env.EXPO_PUBLIC_IS_DEV === "true" &&
  Updates.channel !== "preview" &&
  Updates.channel !== "production";

const useTunneling = true;
const IP_ADDRESS = true ? "localhost" : "192.168.0.197";
export const WORKERS = (() => ({
  AUTH_WORKER: isDev
    ? useTunneling
      ? "https://nikas-proxy.ment.ge/"
      : `http://${IP_ADDRESS}:8785/`
    : process.env.EXPO_PUBLIC_API_URL + "/",
}))();
