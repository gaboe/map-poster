import { createTRPCRouter } from "@/infrastructure/trpc/init";
import { router as userRouter } from "@/users/trpc/user";
import type {
  inferRouterInputs,
  inferRouterOutputs,
} from "@trpc/server";
import { router as adminRouter } from "@/admin/trpc/admin";
import { router as observabilityRouter } from "@/admin/trpc/observability";
import { router as testingRouter } from "@/infrastructure/trpc/testing";
import { router as mapPosterRouter } from "@/map-poster/trpc/router";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  mapPoster: mapPosterRouter,
  observability: observabilityRouter,
  testing: testingRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
