import { createTRPCRouter } from "@/infrastructure/trpc/init";
import { router as userRouter } from "@/users/trpc/user";
import { router as projectRouter } from "@/projects/trpc/project";
import { router as organizationRouter } from "@/organizations/trpc/organization";
import type {
  inferRouterInputs,
  inferRouterOutputs,
} from "@trpc/server";
import { router as organizationMemberRouter } from "@/organizations/trpc/members";
import { router as organizationInvitationsRouter } from "@/organizations/trpc/invitations";
import { router as adminRouter } from "@/admin/trpc/admin";
import { router as observabilityRouter } from "@/admin/trpc/observability";
import { projectPermissionsRouter } from "@/project-permissions/trpc/project-permissions";
import { router as testingRouter } from "@/infrastructure/trpc/testing";
import { router as mapPosterRouter } from "@/map-poster/trpc/router";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  mapPoster: mapPosterRouter,
  observability: observabilityRouter,
  organization: organizationRouter,
  organizationInvitations: organizationInvitationsRouter,
  organizationMember: organizationMemberRouter,
  project: projectRouter,
  projectPermissions: projectPermissionsRouter,
  testing: testingRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
