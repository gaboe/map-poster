import * as React from "react";
import { Button } from "./button";
import { cn } from "@/infrastructure/lib/utils";

type Props = {
  onCancel: () => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
};

export function CancelButton({
  onCancel,
  children = "Cancel",
  className,
  disabled = false,
  variant = "outline",
  size = "default",
}: Props) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onCancel}
      disabled={disabled}
      className={cn(className)}
    >
      {children}
    </Button>
  );
}
