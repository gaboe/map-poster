import type { TRPCRouterRecord } from "@trpc/server";
import { protectedProcedure } from "@/infrastructure/trpc/procedures/auth";
import { TRPCError } from "@trpc/server";

export const router = {
  throwTestError: protectedProcedure.mutation(async () => {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "This is a test error from the backend (TRPC)",
    });
  }),
} satisfies TRPCRouterRecord;
