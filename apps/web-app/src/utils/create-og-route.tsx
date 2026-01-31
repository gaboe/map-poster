import type { ReactElement } from "react";
import {
  generateOgImage,
  createOgImageResponse,
  OG_CACHE,
} from "@/utils/og-image-generator";

/**
 * Creates a server handler for OG image generation
 * @param getComponent - Function that returns the React component to render
 * @param errorMessage - Custom error message for logging
 * @param cacheControl - Cache strategy (default: normal - 1 hour)
 * @returns Server handler function
 */
export function createOgImageHandler(
  getComponent: () => ReactElement | Promise<ReactElement>,
  errorMessage: string = "OG Image",
  cacheControl: string = OG_CACHE.normal
) {
  return async () => {
    try {
      const component = await getComponent();
      const pngBuffer = await generateOgImage(component);
      const response = createOgImageResponse(
        pngBuffer,
        cacheControl
      );

      // Ensure Content-Type is always image/png (TanStack may override this)
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "image/png");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error(`[${errorMessage}] Error:`, error);
      return new Response("Failed to generate OG image", {
        status: 500,
      });
    }
  };
}
