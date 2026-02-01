import type { TRPCRouterRecord } from "@trpc/server";
import { publicProcedure } from "@/infrastructure/trpc/procedures/auth";

export const router = {
  getInfo: publicProcedure.query(
    async ({ ctx: { session } }) => {
      if (!session) {
        return null;
      }
      return session?.user;
    }
  ),
} satisfies TRPCRouterRecord;
