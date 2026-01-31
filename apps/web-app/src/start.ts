import { createStart } from "@tanstack/react-start";
import { sentryFunctionMiddleware } from "@/infrastructure/middleware/sentry-function-middleware";

/**
 * TanStack Start configuration
 *
 * This file configures global middleware and other Start-specific options
 */
export const startInstance = createStart(() => {
  return {
    // Global middleware for all server functions
    functionMiddleware: [sentryFunctionMiddleware],
  };
});
