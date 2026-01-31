import { IconLogout } from "@tabler/icons-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { signOut } from "@/auth/auth-client";
import { useNavigate } from "@tanstack/react-router";

export function NavUser({
  user,
}: {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    void navigate({ to: "/sign-in" });
  };

  return (
    <SidebarMenu>
      {/* Log out as separate menu item */}
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={handleLogout}
          className="cursor-pointer"
        >
          <IconLogout />
          <span className="font-bold text-sm">Log out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* User profile display only */}
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default"
        >
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarImage
              src={user.image ?? ""}
              alt={user.name ?? ""}
            />
            <AvatarFallback className="rounded-lg">
              CN
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold text-sm">
              {user.name}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
