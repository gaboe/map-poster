import { createMiddleware } from "@tanstack/react-start";
import * as Sentry from "@sentry/tanstackstart-react";
import { captureException } from "@/infrastructure/sentry-utils";

/**
 * Global server function middleware that adds Sentry tracing to all server functions
 *
 * This middleware:
 * - Wraps server function execution in a Sentry span
 * - Captures timing information
 * - Adds user context from session
 * - Automatically captures errors
 */
export const sentryFunctionMiddleware = createMiddleware({
  type: "function",
})
  .client(async ({ next, serverFnMeta }) => {
    const startTime = performance.now();

    // Clean up function name from TanStack's internal naming
    // In client middleware, serverFnMeta only has id (ClientFnMeta)
    let functionName =
      serverFnMeta.id ?? "unknown-function";

    if (functionName.includes("--")) {
      const parts = functionName.split("--");
      const funcPart = parts[1]?.split(
        "_createServerFn"
      )[0];
      functionName = funcPart ?? functionName;
    }

    try {
      const result = await next();
      // const duration = performance.now() - startTime;

      // console.log(
      //   `[Client] ${functionName} completed in ${duration.toFixed(2)}ms`
      // );

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `[Client] ${functionName} failed after ${duration.toFixed(2)}ms:`,
        error
      );
      throw error;
    }
  })
  .server(async ({ next, data, serverFnMeta }) => {
    // Clean up function name from TanStack's internal naming
    // In server middleware, serverFnMeta has id, name, and filename (ServerFnMeta)
    let functionName =
      serverFnMeta.name ??
      serverFnMeta.filename ??
      serverFnMeta.id ??
      "unknown-function";

    if (functionName.includes("--")) {
      const parts = functionName.split("--");
      const funcPart = parts[1]?.split(
        "_createServerFn"
      )[0];
      functionName = funcPart || functionName;
    }

    const startTime = Date.now();

    return Sentry.startSpan(
      {
        op: "function.server",
        name: functionName,
        attributes: {
          hasData: data !== undefined,
          functionName,
        },
      },
      async (span) => {
        try {
          const result = await next();
          // const duration = Date.now() - startTime;

          // console.log(
          //   `[Server] ${functionName} completed in ${duration}ms`
          // );

          // Mark span as successful
          span.setStatus({ code: 1 }); // OK status

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;

          console.error(
            `[Server] ${functionName} failed after ${duration}ms:`,
            error
          );

          // Capture error in Sentry (uses helper that marks expected TRPC errors as handled)
          captureException(error);

          // Mark span as error
          span.setStatus({ code: 2 }); // ERROR status

          throw error;
        }
      }
    );
  });
