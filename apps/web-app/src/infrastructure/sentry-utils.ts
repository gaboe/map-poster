import * as Sentry from "@sentry/tanstackstart-react";
import type { TRPCError } from "@trpc/server";
import { EXPECTED_TRPC_CODES } from "./errors";

/**
 * Duck-typed TRPCClientError shape for type guard.
 * Exported for reuse in error boundary components.
 */
export type TRPCClientErrorLike = {
  name: "TRPCClientError";
  data: { code?: string } | null;
};

/**
 * Check if error is a TRPCError using duck-typing to avoid module boundary issues
 * TRPCError has: name === 'TRPCError', code property, and message
 */
function isTRPCError(error: unknown): error is TRPCError {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "TRPCError" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

/**
 * Check if error is a TRPCClientError using duck-typing.
 * TRPCClientError has: name === 'TRPCClientError' and data property (can be null).
 * Exported for reuse in error boundary components.
 */
export function isTRPCClientError(
  error: unknown
): error is TRPCClientErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "TRPCClientError" &&
    "data" in error
  );
}

/**
 * Check if error is an expected TRPC error (user-facing, not a bug)
 * Works for both server-side TRPCError and client-side TRPCClientError
 * Uses duck-typing instead of instanceof to avoid module boundary issues in SSR
 */
export function isExpectedTRPCError(
  error: unknown
): boolean {
  // Server-side TRPCError
  if (isTRPCError(error)) {
    return (
      EXPECTED_TRPC_CODES as readonly string[]
    ).includes(error.code);
  }

  // Client-side TRPCClientError
  if (isTRPCClientError(error)) {
    const code = error.data?.code;
    return (
      typeof code === "string" &&
      (EXPECTED_TRPC_CODES as readonly string[]).includes(
        code
      )
    );
  }

  return false;
}

/**
 * Capture exception to Sentry with proper handling for expected TRPC errors.
 *
 * Expected errors (NOT_FOUND, FORBIDDEN, UNAUTHORIZED, BAD_REQUEST):
 * - Still logged to Sentry for monitoring (detect spikes)
 * - Marked as "handled" so they don't create issues
 * - Level downgraded to "warning"
 *
 * Unexpected errors:
 * - Normal Sentry capture as "error"
 */
export function captureException(
  error: unknown,
  captureContext?: Sentry.CaptureContext
) {
  if (isExpectedTRPCError(error)) {
    // Expected error - log but mark as handled
    Sentry.withScope((scope) => {
      scope.setLevel("warning");
      scope.setTag("error.expected", "true");

      // Capture with mechanism hint
      Sentry.captureException(error, {
        mechanism: { type: "generic", handled: true },
      });
    });
  } else {
    // Unexpected error - normal capture
    Sentry.captureException(error, captureContext);
  }
}

/**
 * Helper to mark expected TRPC errors in beforeSend hook.
 * Use this in Sentry.init() beforeSend callback.
 *
 * Returns modified event with:
 * - mechanism.handled = true
 * - level = "warning"
 */
export function markExpectedTRPCErrorInEvent(
  event: Sentry.ErrorEvent,
  error: unknown
): Sentry.ErrorEvent {
  if (!isExpectedTRPCError(error)) {
    return event;
  }

  // Mark as handled in all exception values
  event.exception?.values?.forEach((exception) => {
    if (exception.mechanism) {
      exception.mechanism.handled = true;
    } else {
      exception.mechanism = {
        type: "generic",
        handled: true,
      };
    }
  });

  // Downgrade level to warning
  event.level = "warning";

  // Add tag for filtering
  event.tags = { ...event.tags, "error.expected": "true" };

  return event;
}
