// Utility functions for generating structured data (schema.org) markup
import { createPageTitle } from "./seo";

export type StructuredDataType =
  | "Organization"
  | "WebSite"
  | "WebPage"
  | "SoftwareApplication"
  | "TechArticle"
  | "BreadcrumbList";

export type OrganizationSchema = {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
  contactPoint?: {
    "@type": "ContactPoint";
    contactType: string;
    url: string;
  };
  foundingDate?: string;
  founders?: {
    "@type": "Person";
    name: string;
  }[];
};

export type WebSiteSchema = {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  publisher: {
    "@type": "Organization";
    name: string;
    logo: string;
  };
  potentialAction?: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
};

export type WebPageSchema = {
  "@context": "https://schema.org";
  "@type": "WebPage";
  name: string;
  url: string;
  description: string;
  isPartOf: {
    "@type": "WebSite";
    name: string;
    url: string;
  };
  about?: {
    "@type": "Thing";
    name: string;
  };
  mainEntity?: {
    "@type": "SoftwareApplication";
    name: string;
    applicationCategory: string;
    description: string;
  };
};

export type SoftwareApplicationSchema = {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    availability: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
  };
  softwareVersion?: string;
  releaseNotes?: string;
};

export type BreadcrumbSchema = {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
};

// Generate Organization schema
export function createOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "map-poster",
    url: "https://map-poster.cz",
    logo: "https://map-poster.cz/logo.png",
    description:
      "All-in-one integration platform that enables AI solutions to securely access data from diverse sources through standardized Model Context Protocol (MCP) and modern authentication protocols.",
    sameAs: [
      "https://github.com/blogic/map-poster",
      "https://twitter.com/blogictemplate",
      "https://linkedin.com/company/map-poster",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: "https://map-poster.cz/contact",
    },
    foundingDate: "2024",
  };
}

// Generate WebSite schema with search functionality
export function createWebSiteSchema(): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "map-poster",
    url: "https://map-poster.cz",
    description:
      "Connect your AI solution to data with built-in authentication. map-poster enables secure access to diverse data sources through MCP and modern authentication protocols.",
    publisher: {
      "@type": "Organization",
      name: "map-poster",
      logo: "https://map-poster.cz/logo.png",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://map-poster.cz/docs?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Generate Software Application schema
export function createSoftwareApplicationSchema(): SoftwareApplicationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "map-poster Platform",
    description:
      "Enterprise AI integration platform for connecting AI solutions to diverse data sources with built-in authentication and security.",
    url: "https://map-poster.cz",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    publisher: {
      "@type": "Organization",
      name: "map-poster",
    },
    softwareVersion: "1.0",
  };
}

// Generate WebPage schema
export function createWebPageSchema(
  url: string,
  description: string,
  about?: string,
  ...titleParts: string[]
): WebPageSchema {
  const name = createPageTitle(...titleParts);

  const schema: WebPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    url,
    description,
    isPartOf: {
      "@type": "WebSite",
      name: "map-poster",
      url: "https://map-poster.cz",
    },
  };

  if (about) {
    schema.about = {
      "@type": "Thing",
      name: about,
    };
  }

  return schema;
}

// Generate Breadcrumb schema
export function createBreadcrumbSchema(
  items: { name: string; url: string }[]
): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Helper to generate script tag for structured data
export function structuredDataScript(
  schema: Record<string, unknown>
) {
  return {
    type: "application/ld+json",
    innerHTML: JSON.stringify(schema, null, 0),
  };
}
