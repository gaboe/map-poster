import { auth } from "@/auth/auth";
import { db } from "@/infrastructure/db";
import {
  runtime,
  type EffectRuntime,
} from "@/infrastructure/effect-runtime";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import * as Sentry from "@sentry/tanstackstart-react";
import { logger } from "@map-poster/logger";

export const createTRPCContext = async ({
  headers,
}: {
  headers: Headers;
}) => {
  const session = await auth.api.getSession({
    headers,
  });

  return {
    db,
    effectRuntime: runtime as EffectRuntime,
    headers,
    session,
  };
};

export const t = initTRPC
  .context<typeof createTRPCContext>()
  .create({
    transformer: superjson,
  });

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

// Sentry middleware for automatic tracing of all tRPC procedures
export const sentryMiddleware = t.middleware(
  Sentry.trpcMiddleware({
    attachRpcInput: true,
  })
);

// Debug middleware to see what's being called with timing
export const debugMiddleware = t.middleware(
  async (opts) => {
    const startTime = Date.now();
    const result = await opts.next();

    logger.info(
      {
        type: opts.type,
        path: opts.path,
        duration: Date.now() - startTime,
      },
      "[tRPC Server] Request completed"
    );

    return result;
  }
);
