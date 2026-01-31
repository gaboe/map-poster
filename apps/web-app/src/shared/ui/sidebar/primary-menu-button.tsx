import * as React from "react";
import { SidebarMenuButton } from "@/shared/ui/sidebar";
import { cn } from "@/infrastructure/lib/utils";

// PrimaryMenuButton: for main sidebar items (large font, bold)
export const PrimaryMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithRef<typeof SidebarMenuButton>
>(function PrimaryMenuButton(
  { className = "", ...props },
  ref
) {
  return (
    <SidebarMenuButton
      ref={ref}
      className={cn("text-base font-bold", className)}
      {...props}
    />
  );
});
