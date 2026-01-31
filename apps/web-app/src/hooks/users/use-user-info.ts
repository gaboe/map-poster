import { useTRPC } from "@/infrastructure/trpc/react";
import { useSuspenseQuery } from "@tanstack/react-query";

export function useUserInfo() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.user.getInfo.queryOptions());
}
