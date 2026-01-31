import * as React from "react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/shared/ui/sidebar";

type Props = {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
};

export function BaseLayout({
  sidebar,
  header,
  subtitle,
  description,
  children,
}: Props) {
  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset>
        {header}
        <div className="flex flex-1 flex-col px-4 md:px-8 py-4 xl:py-6 min-w-0">
          <div className="max-w-6xl mx-auto w-full min-w-0">
            {/* Subtitle and description section */}
            {subtitle && (
              <div className="flex items-center justify-between mb-4 xl:mb-6">
                <div>
                  <h1 className="text-xl xl:text-2xl font-semibold tracking-tight">
                    {subtitle}
                  </h1>
                  {description && (
                    <p className="text-muted-foreground mt-1 xl:mt-2 text-sm xl:text-base">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            )}
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
