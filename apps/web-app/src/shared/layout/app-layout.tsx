import { AppSidebar } from "@/shared/sidebar";
import { SiteHeader } from "@/shared/layout/site-header";
import { BaseLayout } from "@/shared/layout/base-layout";

export function AppLayout({
  title,
  subtitle,
  description,
  headerActions,
  children,
  sidebarVariant = "inset",
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  sidebarVariant?: "inset" | "sidebar" | "floating";
}) {
  return (
    <BaseLayout
      sidebar={<AppSidebar variant={sidebarVariant} />}
      header={
        <SiteHeader title={title} actions={headerActions} />
      }
      subtitle={subtitle}
      description={description}
    >
      {children}
    </BaseLayout>
  );
}
