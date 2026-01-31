import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { ReactElement } from "react";
import { logger } from "@map-poster/logger";

export const OG_CACHE = {
  short: "public, max-age=300, s-maxage=300", // 5 minutes
  normal:
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400", // 1 hour
  long: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800", // 24 hours
} as const;

// Load fonts once at module level (cached)
const fontsCache = new Map<string, ArrayBuffer>();

async function loadFont(
  fontPath: string
): Promise<ArrayBuffer> {
  if (fontsCache.has(fontPath)) {
    return fontsCache.get(fontPath)!;
  }

  const fullPath = `${process.cwd()}/src/assets/fonts/${fontPath}`;
  const fontBuffer = await Bun.file(fullPath).arrayBuffer();

  fontsCache.set(fontPath, fontBuffer);
  return fontBuffer;
}

// Load static Oxanium fonts (individual weight files for better compatibility)
const oxanium400 = await loadFont("Oxanium-400.ttf");
const oxanium500 = await loadFont("Oxanium-500.ttf");
const oxanium600 = await loadFont("Oxanium-600.ttf");
const oxanium700 = await loadFont("Oxanium-700.ttf");

const fonts = [
  {
    name: "Oxanium",
    data: oxanium400,
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: "Oxanium",
    data: oxanium500,
    weight: 500 as const,
    style: "normal" as const,
  },
  {
    name: "Oxanium",
    data: oxanium600,
    weight: 600 as const,
    style: "normal" as const,
  },
  {
    name: "Oxanium",
    data: oxanium700,
    weight: 700 as const,
    style: "normal" as const,
  },
];

export type GenerateOgImageOptions = {
  width?: number;
  height?: number;
};

/**
 * Generates an OG image from a React component
 * @param component React component to render
 * @param options Width and height (default: 1200x630)
 * @returns PNG image as Buffer
 */
export async function generateOgImage(
  component: ReactElement,
  options: GenerateOgImageOptions = {}
): Promise<Buffer> {
  const { width = 1200, height = 630 } = options;

  try {
    // Convert JSX to SVG using Satori
    const svg = await satori(component, {
      width,
      height,
      fonts,
    });

    // Convert SVG to PNG using Resvg
    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return Buffer.from(pngBuffer);
  } catch (error) {
    logger.error(
      {
        error,
        message:
          error instanceof Error
            ? error.message
            : String(error),
        stack:
          error instanceof Error ? error.stack : undefined,
      },
      "OG Image Generator error"
    );
    throw error;
  }
}

/**
 * Creates a Response object with proper OG image headers
 * @param pngBuffer PNG image buffer
 * @param cacheControl Cache-Control header value
 * @returns Response object
 */
export function createOgImageResponse(
  pngBuffer: Buffer,
  cacheControl: string
): Response {
  return new Response(pngBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": cacheControl,
    },
  });
}
