import { useRouteContext } from "@tanstack/react-router";

/**
 * Provides type-safe access to data that was loaded in the root route's
 * beforeLoad hook, including session, theme, and other global state.
 *
 * @returns Root route context containing session, theme, and other global data
 */
export function useRootContext() {
  return useRouteContext({ from: "__root__" });
}
