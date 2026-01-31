import * as React from "react";
import { SidebarMenuButton } from "@/shared/ui/sidebar";
import { cn } from "@/infrastructure/lib/utils";

// SecondaryMenuButton: for sidebar sub-items (smaller font, normal weight, more left padding)
export const SecondaryMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithRef<typeof SidebarMenuButton>
>(function SecondaryMenuButton(
  { className = "", ...props },
  ref
) {
  return (
    <SidebarMenuButton
      ref={ref}
      className={cn("pl-6 text-sm font-normal", className)}
      {...props}
    />
  );
});
