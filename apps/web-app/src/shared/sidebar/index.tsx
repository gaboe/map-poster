import * as React from "react";
import {
  IconLayoutGrid,
  IconDatabase,
  IconFileWord,
  IconInnerShadowTop,
  IconReport,
  IconSettings,
  IconUsers,
  IconChartBar,
} from "@tabler/icons-react";

import { NavSecondary } from "@/shared/sidebar/nav-secondary";
import { NavUser } from "@/shared/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/shared/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import OrganizationSidebarSections from "@/shared/sidebar/organization-sidebar-section";
import { PrimaryMenuButton } from "@/shared/ui/sidebar/primary-menu-button";
import { SecondaryMenuButton } from "@/shared/ui/sidebar/secondary-menu-button";
import { useUserInfo } from "@/hooks/users/use-user-info";

const data = {
  navSecondary: [
    // Settings removed - only Theme toggle remains in secondary nav
    // {
    //   title: "Get Help",
    //   url: "#",
    //   icon: IconHelp,
    // },
    // Search removed - no functionality available
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
};

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: user } = useUserInfo();
  const router = useRouterState();
  const currentPath = router.location.pathname;
  // Check if user has admin role from Better Auth (TODO: use access rights)
  const isAdmin = user?.role === "admin";
  // Show admin section only if user is admin and is in /app/admin section
  const inAdminSection =
    currentPath.startsWith("/app/admin");
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to="/" />}
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <IconInnerShadowTop className="!size-5" />
              <span className="text-lg font-bold">
                map-poster
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col flex-1 min-h-0">
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <PrimaryMenuButton
                  render={<Link to="/app/dashboard" />}
                  className={[
                    (currentPath === "/app/dashboard" ||
                      currentPath === "/app") &&
                      "bg-primary/10 font-bold",
                  ].join(" ")}
                >
                  <IconLayoutGrid className="!size-5" />
                  <span>Dashboard</span>
                </PrimaryMenuButton>
              </SidebarMenuItem>
              <OrganizationSidebarSections
                currentPath={currentPath}
              />

              {/* Admin menu entry: always visible for admins */}
              {isAdmin && (
                <SidebarMenuItem>
                  <PrimaryMenuButton
                    render={<Link to="/app/admin" />}
                    className={[
                      currentPath.startsWith("/app/admin")
                        ? "bg-primary/10 font-bold"
                        : "",
                    ].join(" ")}
                  >
                    <IconSettings className="!size-5" />
                    <span>Admin</span>
                  </PrimaryMenuButton>
                </SidebarMenuItem>
              )}
              {/* Admin section: show only if user is admin and in /app/admin */}
              {isAdmin && inAdminSection && (
                <>
                  <SidebarMenuItem>
                    <SecondaryMenuButton
                      render={
                        <Link to="/app/admin/users" />
                      }
                    >
                      <IconUsers className="!size-5" />
                      <span>User Management</span>
                    </SecondaryMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SecondaryMenuButton
                      render={
                        <Link to="/app/admin/observability" />
                      }
                    >
                      <IconChartBar className="!size-5" />
                      <span>Observability</span>
                    </SecondaryMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Settings, Help, Search at the bottom */}
        <NavSecondary
          items={data.navSecondary}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter className="sticky bottom-0 bg-inherit z-10">
        {user && (
          <NavUser
            user={{
              name: user.name ?? "",
              email: user.email ?? "",
              image: user.image ?? "",
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
