import { useRootContext } from "@/hooks/use-root-context";

/**
 * Hook for accessing current user authentication state.
 *
 * Uses TanStack Start's root route context to get the session that was
 * fetched server-side in __root.tsx beforeLoad. This ensures consistent
 * authentication state between server and client, preventing hydration
 * mismatches.
 */
export function useUser() {
  const { session } = useRootContext();
  return {
    user: session?.user || null,
    isPending: false,
  };
}
