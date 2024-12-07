import { cn } from "@/lib/utils";
import { Avatar } from "../ui/avatar";

export const AvatarWidth = 70;

function UserAvatarLayout({
  size = "md",
  children,
  borderColor = "pink",
}: {
  children: React.ReactNode;
  borderColor?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Avatar
      className={cn(
        `border-2 p-1 flex items-center justify-center`,
        borderColor === "green" && `border-green-500`,
        borderColor === "pink" && `border-pink-500`,
        borderColor === "blue" && `border-blue-500`,
        borderColor === "gray" && `border-gray-500`
      )}
      alt="Avatar"
      style={{
        width: size === "sm" ? 50 : size === "md" ? 60 : 70,
        height: size === "sm" ? 50 : size === "md" ? 60 : 70,
        borderRadius: size === "sm" ? 25 : size === "md" ? 30 : 35,
      }}
    >
      {children}
    </Avatar>
  );
}

export default UserAvatarLayout;
