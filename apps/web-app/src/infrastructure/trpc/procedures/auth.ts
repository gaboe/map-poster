import {
  t,
  sentryMiddleware,
  debugMiddleware,
} from "@/infrastructure/trpc/init";
import { unauthorizedError } from "@/infrastructure/errors";
import { type UserId } from "@map-poster/common";

const enforceUserIsAuthenticated = t.middleware(
  ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw unauthorizedError();
    }

    return next({
      ctx: {
        session: {
          ...ctx.session,
          user: {
            ...ctx.session.user,
            id: ctx.session.user.id as UserId,
          },
        },
      },
    });
  }
);

const enforceUserIsAdmin = t.middleware(
  async ({ ctx, next }) => {
    if (
      !ctx.session?.user ||
      ctx.session.user.role !== "admin"
    ) {
      throw unauthorizedError();
    }
    return next({ ctx });
  }
);

export const publicProcedure = t.procedure
  .use(debugMiddleware)
  .use(sentryMiddleware);
export const protectedProcedure = t.procedure
  .use(debugMiddleware)
  .use(sentryMiddleware)
  .use(enforceUserIsAuthenticated);
export const adminProcedure = t.procedure
  .use(debugMiddleware)
  .use(sentryMiddleware)
  .use(enforceUserIsAdmin);
