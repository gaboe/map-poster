export const seo = ({
  title,
  description,
  keywords,
  image,
  canonical,
  logo,
}: {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
  canonical?: string;
  logo?: string;
}) => {
  const tags = [
    { title },
    ...(description
      ? [{ name: "description", content: description }]
      : []),
    ...(keywords
      ? [{ name: "keywords", content: keywords }]
      : []),
    { name: "twitter:title", content: title },
    ...(description
      ? [
          {
            name: "twitter:description",
            content: description,
          },
        ]
      : []),
    {
      name: "twitter:creator",
      content: "@blogicTemplateAI",
    },
    { name: "twitter:site", content: "@blogicTemplateAI" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    ...(description
      ? [
          {
            property: "og:description",
            content: description,
          },
        ]
      : []),
    ...(canonical
      ? [{ property: "og:url", content: canonical }]
      : []),
    ...(logo
      ? [{ property: "og:logo", content: logo }]
      : []),
    {
      property: "linkedin:company",
      content:
        "https://www.linkedin.com/company/map-poster",
    },
    ...(image
      ? [
          { name: "twitter:image", content: image },
          {
            name: "twitter:card",
            content: "summary_large_image",
          },
          { property: "og:image", content: image },
        ]
      : [
          {
            name: "twitter:card",
            content: "summary",
          },
        ]),
  ];

  return tags;
};

export const getCanonicalLinks = (canonical?: string) => {
  if (!canonical) return [];
  return [
    {
      rel: "canonical",
      href: canonical,
    },
  ];
};

/**
 * Creates consistent page title with pipe separator
 * @example
 * createPageTitle("Docs") // "Docs | map-poster"
 * createPageTitle("Claude Code", "Docs") // "Claude Code | Docs | map-poster"
 * createPageTitle("Pricing") // "Pricing | map-poster"
 */
export function createPageTitle(
  ...parts: string[]
): string {
  return [...parts, "map-poster"].join(" | ");
}
