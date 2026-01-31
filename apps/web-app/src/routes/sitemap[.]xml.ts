import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const currentDate = new Date()
          .toISOString()
          .split("T")[0];

        const staticUrls = [
          {
            loc: "https://map-poster.cz/",
            lastmod: currentDate,
          },
          {
            loc: "https://map-poster.cz/contact",
            lastmod: currentDate,
          },
          {
            loc: "https://map-poster.cz/privacy-policy",
            lastmod: currentDate,
          },
          {
            loc: "https://map-poster.cz/tos",
            lastmod: currentDate,
          },
          {
            loc: "https://map-poster.cz/newsroom",
            lastmod: currentDate,
          },
          {
            loc: "https://map-poster.cz/newsroom/introducing-map-poster-production-ready-fullstack-typescript",
            lastmod: currentDate,
          },
          {
            loc: "https://map-poster.cz/sign-in",
            lastmod: currentDate,
          },
          {
            loc: "https://map-poster.cz/sign-up",
            lastmod: currentDate,
          },
        ];

        const allUrls = staticUrls;

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600", // Cache for 1 hour
          },
        });
      },
    },
  },
});
