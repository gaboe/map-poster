import { MainLanding } from "@/web/landing/components/main-landing";
import { createFileRoute } from "@tanstack/react-router";
import { seo, getCanonicalLinks } from "@/utils/seo";
import { env } from "@/env/client";

export const Route = createFileRoute("/_web/")({
  head: () => ({
    meta: [
      ...seo({
        title: "map-poster",
        description: "map-poster",
        keywords: "map-poster",
        canonical: "https://map-poster.cz",
        image: `${env.VITE_BASE_URL}/api/og/page/homepage.png`,
      }),
    ],
    links: [...getCanonicalLinks(env.VITE_BASE_URL)],
  }),
  component: Home,
});

function Home() {
  return <MainLanding />;
}
