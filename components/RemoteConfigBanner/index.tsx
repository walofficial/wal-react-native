import "@react-native-firebase/app";
import React, { useEffect } from "react";
import remoteConfig from "@react-native-firebase/remote-config";
import { useAtom } from "jotai";
import { firebaseRemoteConfigState } from "../../lib/state/storage";
import { Redirect } from "expo-router";
import { isDev } from "@/lib/api/config";

const RemoteConfigBanner = () => {
  const [remoteConfigData, setRemoteConfigData] = useAtom(
    firebaseRemoteConfigState
  );

  useEffect(() => {
    const fetchAndActivateConfig = async () => {
      try {
        await remoteConfig().setDefaults({
          mentbanner: JSON.stringify({
            type: "info",
            message: "Default message",
            canBeHidden: true,
          }),
        });

        await remoteConfig().fetchAndActivate();

        const updateConfig = () => {
          const configValue = remoteConfig().getString("showbanner");

          if (!configValue) return setRemoteConfigData(null);
          const parsedConfig = JSON.parse(configValue);
          setRemoteConfigData(parsedConfig);
        };

        // Initial update
        updateConfig();

        // Listen for remote config updates
        remoteConfig().onConfigUpdated(async () => {
          await remoteConfig().activate();
          updateConfig();
        });
      } catch (error) {
        console.error("Error fetching remote config:", error);
      }
    };

    fetchAndActivateConfig();
  }, [setRemoteConfigData]);

  if (isDev) return null;
  if (!remoteConfigData) return null;

  if (remoteConfigData) {
    return <Redirect href="/message" />;
  }
};

export default RemoteConfigBanner;
