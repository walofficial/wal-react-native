import { useState, useEffect } from "react";
import { AVPlaybackStatus } from "expo-av";

export const useVideoError = (status: AVPlaybackStatus | null) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status && "error" in status) {
      setErrorMessage(status.error);
    } else {
      setErrorMessage(null);
    }
  }, [status]);

  return [errorMessage, setErrorMessage];
};
