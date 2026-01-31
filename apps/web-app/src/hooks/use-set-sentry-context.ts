import { useLayoutEffect } from "react";
import * as Sentry from "@sentry/tanstackstart-react";
import { Route } from "@/routes/__root";

export function useSetSentryContext() {
  const { session } = Route.useRouteContext();

  useLayoutEffect(() => {
    if (session?.user) {
      Sentry.setUser({
        id: session.user.id,
        email: session.user.email,
        username: session.user.name,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [session]);
}
