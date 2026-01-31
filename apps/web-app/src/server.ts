import * as Sentry from "@sentry/tanstackstart-react";
import handler from "@tanstack/react-start/server-entry";
import { env } from "@/env/server";
import { markExpectedTRPCErrorInEvent } from "@/infrastructure/sentry-utils";
import { disposeRuntime } from "@/infrastructure/effect-runtime";
import { logger } from "@map-poster/logger";

export default {
  fetch: async (request: Request) => {
    try {
      return await handler.fetch(request);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return new Response(null, { status: 499 });
      }
      throw error;
    }
  },
};

const isDev = env.ENVIRONMENT === "dev";
const sampleRate = isDev ? 1.0 : 0.001;

Sentry.init({
  ...(env.SENTRY_DSN && { dsn: env.SENTRY_DSN }),
  sendDefaultPii: true,
  environment: env.ENVIRONMENT,
  release: env.VERSION,
  dist: "server",
  spotlight: isDev,
  enableLogs: true,
  tracesSampleRate: sampleRate,
  profilesSampleRate: sampleRate,
  profileLifecycle: "trace",
  integrations: [
    // NOTE: postgresIntegration() doesn't work in local dev (TanStack Start limitation)
    // because db Pool is created before Sentry.init() runs due to SSR module loading order.
    // DB queries ARE traced in production via API app (apps/api/src/instrument.ts).
    Sentry.postgresIntegration(),
    Sentry.redisIntegration(),
    Sentry.httpIntegration(),
    // nodeProfilingIntegration(),
  ],
  // Ignore health check endpoint from tracing
  ignoreTransactions: ["/api/health"],
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      return null;
    }
    return markExpectedTRPCErrorInEvent(event, error);
  },
});

// IMPORTANT: Apply console override AFTER Sentry.init()
// Sentry instruments console.error, so we need to wrap Sentry's wrapper
const sentryConsoleError = console.error;

const filterAbortError = (...args: unknown[]): boolean => {
  const firstArg = args[0];

  if (
    firstArg instanceof DOMException &&
    firstArg.name === "AbortError"
  ) {
    return true;
  }

  const stringified = String(firstArg);
  if (
    stringified.includes("AbortError") &&
    stringified.includes("The connection was closed")
  ) {
    return true;
  }

  const allArgs = args.join(" ");
  if (
    allArgs.includes("AbortError") &&
    allArgs.includes("The connection was closed")
  ) {
    return true;
  }

  return false;
};

console.error = (...args: unknown[]) => {
  if (filterAbortError(...args)) return;
  sentryConsoleError.apply(console, args);
};

// =============================================================================
// Graceful Shutdown
// =============================================================================

/**
 * Handle graceful shutdown - dispose Effect ManagedRuntime.
 *
 * Shutdown sequence:
 * 1. Grace period for in-flight requests to complete (K8s stops new traffic on SIGTERM)
 * 2. Dispose Effect runtime with timeout protection
 * 3. Let process exit naturally (no process.exit)
 */
process.on("SIGTERM", async () => {
  logger.info(
    "[Server] SIGTERM received, starting graceful shutdown..."
  );

  const GRACE_PERIOD_MS = 2000;
  const DISPOSE_TIMEOUT_MS = 5000;

  await new Promise((resolve) =>
    setTimeout(resolve, GRACE_PERIOD_MS)
  );

  let timeoutId: Timer | undefined;
  try {
    await Promise.race([
      disposeRuntime(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Dispose timeout")),
          DISPOSE_TIMEOUT_MS
        );
      }),
    ]);
    logger.info("[Server] Effect runtime disposed");
  } catch (error) {
    logger.error(
      { error },
      "[Server] Error during runtime disposal"
    );
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
});
