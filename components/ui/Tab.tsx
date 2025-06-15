import React from "react";
import { Pressable, PressableProps } from "react-native";
import { cn } from "@/lib/utils";

export interface TabProps extends PressableProps {
  variant?: "active" | "default";
  children?: React.ReactNode;
  className?: string;
}

export function Tab({
  variant = "default",
  children,
  className,
  ...props
}: TabProps) {
  return (
    <Pressable
      className={cn(
        "items-center justify-center",
        variant === "active" && "border-b-2 border-primary",
        className
      )}
      {...props}
    >
      {children}
    </Pressable>
  );
}
