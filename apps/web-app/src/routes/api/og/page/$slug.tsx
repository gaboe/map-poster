import { createFileRoute } from "@tanstack/react-router";
import { GenericOG } from "@/og-templates/generic-og";
import { createOgImageHandler } from "@/utils/create-og-route";
import { OG_CACHE } from "@/utils/og-image-generator";

// Page metadata mapping
const PAGE_METADATA: Record<
  string,
  { title: string; description?: string }
> = {
  homepage: {
    title: "Connect AI to Data with Built-in Auth",
    description:
      "Secure integration platform for AI solutions",
  },
  newsroom: {
    title: "Newsroom",
    description:
      "Latest news, press releases, and announcements from map-poster",
  },
  contact: {
    title: "Contact Us",
    description: "Get in touch with the map-poster team",
  },
  tos: {
    title: "Terms of Service",
  },
  "privacy-policy": {
    title: "Privacy Policy",
  },
};

export const Route = createFileRoute("/api/og/page/$slug")({
  server: {
    handlers: {
      GET: async ({
        params,
      }: {
        params: { slug?: string };
      }) => {
        // Remove .png extension if present
        const slug = params.slug
          ?.toLowerCase()
          .replace(/\.png$/, "");
        const metadata = slug
          ? PAGE_METADATA[slug]
          : undefined;
        const title = metadata?.title || "map-poster";
        const description = metadata?.description;

        return createOgImageHandler(
          () => (
            <GenericOG
              title={title}
              {...(description !== undefined && {
                description,
              })}
            />
          ),
          "OG Page Image",
          OG_CACHE.normal
        )();
      },
    },
  },
});
