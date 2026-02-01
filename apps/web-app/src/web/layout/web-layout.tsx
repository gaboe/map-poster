import { Footer } from "@/web/landing/components/footer";
import type { ReactNode } from "react";
import {
  createOrganizationSchema,
  createWebSiteSchema,
} from "@/utils/structured-data";
import { GradientBackground } from "@/shared/ui/gradient-background";

type Props = {
  children: ReactNode;
};

export function WebLayout({ children }: Props) {
  const organizationSchema = createOrganizationSchema();
  const websiteSchema = createWebSiteSchema();

  return (
    <>
      {/* Global Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            organizationSchema,
            null,
            0
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema, null, 0),
        }}
      />

      <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
        <GradientBackground variant="default" />

        <main className="flex-1 relative z-10">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
