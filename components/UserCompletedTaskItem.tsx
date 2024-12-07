import React from "react";
import {
  View,
  Pressable,
  Image,
  Platform,
  TouchableOpacity,
} from "react-native";
import { UserVerification } from "@/lib/interfaces";
import { convertToCDNUrl, getVideoSrc } from "@/lib/utils";
import SimplifiedVideoPlayback from "@/components/SimplifiedVideoPlayback";

interface UserCompletedTaskItemProps {
  verification: UserVerification;
  onPress: () => void;
  isFirst: boolean;
  videoProps?: {
    showPlayButton?: boolean;
  };
}

const UserCompletedTaskItem: React.FC<UserCompletedTaskItemProps> = ({
  verification,
  onPress,
  isFirst,
  videoProps,
}) => {
  const taskType = verification.verified_image ? "image" : "video";

  const renderVerificationItem = () => {
    if (taskType === "video") {
      return (
        <SimplifiedVideoPlayback
          {...videoProps}
          small
          src={getVideoSrc(verification) || ""}
          shouldPlay={false}
          onVideoPress={onPress}
        />
      );
    } else {
      const imageSrc = verification.verified_image;
      return (
        <Image
          source={{ uri: convertToCDNUrl(imageSrc) }}
          style={{ width: 120, height: 120, borderRadius: 10 }}
        />
      );
    }
  };

  return (
    <Pressable className={isFirst ? "ml-0" : "ml-4"}>
      {renderVerificationItem()}
    </Pressable>
  );
};

export default UserCompletedTaskItem;
