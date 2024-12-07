"use client";
import { Button } from "../ui/button";
import { LogOut } from "@/lib/icons/LogOut";
import { Text } from "../ui/text";
import useAuth from "@/hooks/useAuth";
import AnimatedPressable from "../AnimatedPressable";
export default function LogoutButton() {
  const auth = useAuth();
  const handleLogout = async () => {
    await auth.logout();
  };

  return (
    <AnimatedPressable
      onClick={() => {
        handleLogout();
      }}
      className="w-full mb-3 border border-gray-700 rounded-xl p-4 py-3 flex flex-row items-center"
    >
      <LogOut color="red" />
      <Text className="ml-4 font-semibold">{"გამოსვლა"}</Text>
    </AnimatedPressable>
  );
}
