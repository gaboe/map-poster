import * as React from "react";
import {
  IconInnerShadowTop,
  IconHelp,
  IconSettings,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
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
import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { SecondaryMenuButton } from "@/shared/ui/sidebar/secondary-menu-button";
import { BaseLayout } from "@/shared/layout/base-layout";

function PublicSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
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
                <SecondaryMenuButton
                  render={<Link to="/sign-in" />}
                >
                  <IconSettings className="!size-5" />
                  <span>Sign In</span>
                </SecondaryMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SecondaryMenuButton
                  render={<Link to="/sign-up" />}
                >
                  <IconHelp className="!size-5" />
                  <span>Sign Up</span>
                </SecondaryMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="sticky bottom-0 bg-inherit z-10">
        <div className="p-4 text-sm text-muted-foreground">
          Not signed in
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function PublicSiteHeader(props: {
  title: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { title, actions } = props;
  return (
    <header className="flex flex-col gap-2 border-b px-4 lg:px-6 pt-6 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-2xl font-bold leading-tight">
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex-shrink-0">{actions}</div>
        )}
      </div>
    </header>
  );
}

export function PublicLayout({
  title,
  subtitle,
  description,
  headerActions,
  children,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <BaseLayout
      sidebar={<PublicSidebar variant="inset" />}
      header={
        <PublicSiteHeader
          title={title}
          actions={headerActions}
        />
      }
      subtitle={subtitle}
      description={description}
    >
      {children}
    </BaseLayout>
  );
}
