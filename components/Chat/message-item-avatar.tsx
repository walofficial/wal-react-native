import React from "react";
import { Avatar, AvatarImage } from "../ui/avatar";

interface MessageItemAvatarProps {
  photoUrl: string;
}

const MessageItemAvatar: React.FC<MessageItemAvatarProps> = ({ photoUrl }) => {
  return (
    <Avatar className="flex justify-center items-center object-cover">
      <AvatarImage
        src={photoUrl}
        width={6}
        height={6}
        style={{
          objectFit: "cover",
        }}
      />
    </Avatar>
  );
};

export default MessageItemAvatar;
