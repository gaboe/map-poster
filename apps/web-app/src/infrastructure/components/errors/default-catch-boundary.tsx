import { GeneralError } from "./general-error";
import type { ErrorComponentProps } from "@tanstack/react-router";
import {
  BAD_REQUEST_CODE,
  FORBIDDEN_CODE,
  NOT_FOUND_CODE,
  UNAUTHORIZED_CODE,
} from "@/infrastructure/errors";
import { useEffect } from "react";
import {
  captureException,
  isTRPCClientError,
} from "@/infrastructure/sentry-utils";

function getErrorMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

function isModuleNotFoundError(error: unknown): boolean {
  const message = getErrorMessage(error);
  if (!message) return false;

  return (
    message.startsWith(
      "Failed to fetch dynamically imported module"
    ) ||
    message.startsWith(
      "error loading dynamically imported module"
    ) ||
    message.startsWith("Importing a module script failed")
  );
}

/**
 * Detect RSC reference errors that occur when client JS bundle
 * is out of sync with server-rendered HTML (e.g., after deployment).
 * These errors look like: "TypeError: $R[88] is not a function"
 *
 * Note: We intentionally only catch RSC reference errors, not generic
 * hydration errors like "Hydration failed" or "Text content does not match"
 * because those indicate real application bugs that need to be fixed.
 */
function isRscReferenceMismatchError(
  error: unknown
): boolean {
  const message = getErrorMessage(error);
  if (!message) return false;

  return (
    message.includes("is not a function") &&
    message.includes("$R[")
  );
}

/**
 * URL parameter used to track reload attempts across page reloads.
 * This persists even when sessionStorage is unavailable (Safari private mode).
 */
const RELOAD_PARAM = "_moduleReload";

function shouldReloadForModuleNotFound(): boolean {
  // Check URL parameter first - this survives page reload
  const url = new URL(window.location.href);
  if (url.searchParams.has(RELOAD_PARAM)) {
    return false; // Already reloaded once, don't loop
  }

  // Also check sessionStorage for additional protection within 5s window
  const storageKey = "andocs:lastDynamicImportReloadAt";
  const now = Date.now();

  try {
    const lastReload = Number(
      window.sessionStorage.getItem(storageKey) ?? "0"
    );

    if (now - lastReload < 5_000) {
      return false;
    }

    window.sessionStorage.setItem(storageKey, String(now));
  } catch {
    // sessionStorage unavailable (e.g. Safari private mode)
    // URL parameter already checked above, so we're safe to proceed
  }

  return true;
}

/**
 * Reload the page with a marker parameter to prevent infinite loops.
 * Uses URL parameter instead of window.location.reload() so the marker
 * persists across the reload.
 */
function reloadWithMarker(): void {
  const url = new URL(window.location.href);
  url.searchParams.set(RELOAD_PARAM, "1");
  window.location.href = url.toString();
}

export function DefaultCatchBoundary({
  error,
}: ErrorComponentProps) {
  console.log("[DefaultCatchBoundary] error", error);
  const isTRPCError = isTRPCClientError(error);
  const errorMessage =
    error?.message || String(error) || undefined;
  const trpcCode = isTRPCError
    ? error.data?.code
    : undefined;
  console.log("[DefaultCatchBoundary] trpcCode", trpcCode);

  useEffect(() => {
    if (
      (isModuleNotFoundError(error) ||
        isRscReferenceMismatchError(error)) &&
      shouldReloadForModuleNotFound()
    ) {
      console.log(
        "[DefaultCatchBoundary] Module/hydration error, reloading page..."
      );
      reloadWithMarker();
      return;
    }

    captureException(error);
  }, [error]);
  if (
    trpcCode === BAD_REQUEST_CODE ||
    errorMessage === BAD_REQUEST_CODE
  ) {
    return (
      <GeneralError
        title="400"
        message={
          errorMessage ||
          "Sorry, this page could not be found."
        }
      />
    );
  }
  if (
    trpcCode === UNAUTHORIZED_CODE ||
    errorMessage === UNAUTHORIZED_CODE
  ) {
    return (
      <GeneralError
        title="401"
        message={
          errorMessage ||
          "Sorry, you are not authorized to access this page."
        }
      />
    );
  }
  if (
    trpcCode === FORBIDDEN_CODE ||
    errorMessage === FORBIDDEN_CODE
  ) {
    return (
      <GeneralError
        title="403"
        message={
          errorMessage ||
          "Sorry, you are not authorized to access this page."
        }
      />
    );
  }
  if (
    trpcCode === NOT_FOUND_CODE ||
    errorMessage === NOT_FOUND_CODE
  ) {
    return (
      <GeneralError
        title="404"
        message={
          errorMessage ||
          "Sorry, this page could not be found."
        }
      />
    );
  }

  return (
    <GeneralError
      title={isTRPCError ? "400" : "Error"}
      message={errorMessage}
    />
  );
}
