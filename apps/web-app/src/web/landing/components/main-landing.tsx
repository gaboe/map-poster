import { WebLayout } from "@/web/layout/web-layout";
import { HeroSection } from "@/shared/hero-section";
import { AiFeaturesInteractive } from "@/shared/features-interactive";
import { ComponentPreview } from "@/shared/component-preview";
import { HowItWorksTimeline } from "@/shared/how-it-works-timeline";
import { SupportedLLMs } from "@/shared/supported-llms";
import { TrustedBySection } from "@/shared/trusted-by-section";
import { CtaSection } from "@/shared/cta-section";
import {
  createSoftwareApplicationSchema,
  createWebPageSchema,
} from "@/utils/structured-data";

export function MainLanding() {
  const softwareSchema = createSoftwareApplicationSchema();
  const webpageSchema = createWebPageSchema(
    "https://map-poster.cz",
    "Production-ready full-stack TypeScript template with React 19, TanStack Start, TRPC, PostgreSQL, and CI/CD configurations. Everything you need to build modern web applications.",
    "Full-Stack TypeScript Template",
    "map-poster"
  );

  return (
    <WebLayout>
      {/* Page-specific Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema, null, 0),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webpageSchema, null, 0),
        }}
      />
      <div>
        <HeroSection />
        <AiFeaturesInteractive />
        <ComponentPreview />
        <HowItWorksTimeline />
        <SupportedLLMs />
        <TrustedBySection />
        <CtaSection />
      </div>
    </WebLayout>
  );
}
