import * as React from "react";
import { type Icon, IconBug } from "@tabler/icons-react";
import * as Sentry from "@sentry/tanstackstart-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { ModeToggle } from "@/shared/layout/mode/mode-toggle";

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={<a href={item.url} />}
              >
                <item.icon />
                <span className="font-bold text-sm">
                  {item.title}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                const feedback = Sentry.getFeedback();
                const form = await feedback?.createForm();
                form?.appendToDom();
                form?.open();
              }}
            >
              <IconBug />
              <span className="font-bold text-sm">
                Report Bug
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <ModeToggle />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
