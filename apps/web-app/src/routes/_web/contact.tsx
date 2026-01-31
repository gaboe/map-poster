import { createFileRoute } from "@tanstack/react-router";
import { WebLayout } from "@/web/layout/web-layout";
import { ContactForm } from "@/shared/contact-form";
import { StructuredData } from "@/shared/components/structured-data";
import {
  seo,
  getCanonicalLinks,
  createPageTitle,
} from "@/utils/seo";
import { env } from "@/env/client";

export const Route = createFileRoute("/_web/contact")({
  head: () => ({
    meta: [
      ...seo({
        title: createPageTitle("Contact Us"),
        description:
          "Get in touch with the map-poster team. Contact us for support, partnership opportunities, or to learn more about our AI integration platform.",
        keywords: "map-poster",
        canonical: "https://map-poster.cz/contact",
        image: `${env.VITE_BASE_URL}/api/og/page/contact.png`,
      }),
    ],
    links: [
      ...getCanonicalLinks(`${env.VITE_BASE_URL}/contact`),
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <WebLayout>
      <StructuredData
        url="https://map-poster.cz/contact"
        description="Get in touch with the map-poster team. Contact us for support, partnership opportunities, or to learn more about our AI integration platform."
        about="Contact Information"
        titleParts={["Contact Us"]}
      />
      <ContactForm />
    </WebLayout>
  );
}
