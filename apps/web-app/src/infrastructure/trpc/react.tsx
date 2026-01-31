import { createTRPCContext } from "@trpc/tanstack-react-query";

import type { AppRouter } from "@/infrastructure/trpc/router";

export const { TRPCProvider, useTRPC } =
  createTRPCContext<AppRouter>();
