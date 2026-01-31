import { createFileRoute } from "@tanstack/react-router";
import { WebLayout } from "@/web/layout/web-layout";
import { NewsroomFeatures } from "@/shared/newsroom-features";
import {
  seo,
  getCanonicalLinks,
  createPageTitle,
} from "@/utils/seo";
import { StructuredData } from "@/shared/components/structured-data";
import { env } from "@/env/client";

export const Route = createFileRoute("/_web/newsroom/")({
  component: NewsroomPage,
  head: () => ({
    meta: [
      ...seo({
        title: createPageTitle("Newsroom"),
        description:
          "Latest news, press releases, and announcements from map-poster - the platform for seamless AI integration with real-time data.",
        keywords: "map-poster",
        canonical: "https://map-poster.cz/newsroom",
        image: `${env.VITE_BASE_URL}/api/og/page/newsroom.png`,
      }),
    ],
    links: [
      ...getCanonicalLinks(`${env.VITE_BASE_URL}/newsroom`),
    ],
  }),
});

function NewsroomPage() {
  return (
    <WebLayout>
      <StructuredData
        url="https://map-poster.cz/newsroom"
        description="Latest news, press releases, and announcements from map-poster - the platform for seamless AI integration with real-time data."
        about="Company News and Updates"
        titleParts={["Newsroom"]}
      />
      <NewsroomFeatures />
    </WebLayout>
  );
}
