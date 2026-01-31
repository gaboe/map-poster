// src/routes/__root.tsx
import { useEffect, useState, type ReactNode } from "react";
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
// @ts-ignore https://github.com/TanStack/router/issues/3306
import appCss from "@/styles/app.css?url";
import type { QueryClient } from "@tanstack/react-query";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@/infrastructure/trpc/router";
import { auth } from "@/auth/auth";
import {
  createServerFn,
  createMiddleware,
} from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import {
  TanStackRouterDevtools,
  ReactQueryDevtools,
} from "@/utils/dev-tools";
import { seo, getCanonicalLinks } from "@/utils/seo";
import { getThemeServerFn } from "@/infrastructure/theme";
import { ThemeProvider } from "@/shared/layout/mode/theme-provider";
import { Toaster } from "@/shared/ui/sonner";
import { useSetSentryContext } from "@/hooks/use-set-sentry-context";
import { env } from "@/env/client";
import { NotFoundError } from "@/infrastructure/components/errors/not-found-error";

// SSR timing middleware
const ssrTimingMiddleware = createMiddleware().server(
  async ({ request, next }) => {
    const startTime = Date.now();
    const url = new URL(request.url);
    const routePath = url.pathname;

    try {
      const result = await next();
      // const duration = Date.now() - startTime;

      // console.log(
      //   `[SSR] ${request.method} ${routePath} completed in ${duration}ms`
      // );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[SSR] ${request.method} ${routePath} failed after ${duration}ms:`,
        error
      );
      throw error;
    }
  }
);

const getServerSession = createServerFn({
  method: "GET",
}).handler(async () => {
  // During prerendering, skip session check (no DB access available)
  if (process.env.VITE_PRERENDER === "true") {
    return null;
  }

  try {
    const { headers } = getRequest()!;
    const session = await auth.api.getSession({ headers });

    // Extract only serializable parts to avoid "Function is not serializable" error
    if (!session) {
      return null;
    }

    return {
      session: session.session,
      user: session.user,
    };
  } catch {
    // Invalid or expired session token - treat as unauthenticated
    return null;
  }
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
}>()({
  beforeLoad: async () => {
    const session = await getServerSession();
    // console.log("[__root.tsx] session", session);

    return { session };
  },
  server: {
    middleware: [ssrTimingMiddleware],
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "map-poster",
        description: "map-poster",
        keywords: "map-poster",
        image: `${env.VITE_BASE_URL}/api/og/page/homepage.png`,
        logo: `${env.VITE_BASE_URL}/favicon.svg`,
      }),
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Oxanium:wght@300;400;500;600;700&family=Source+Code+Pro:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "icon",
        href: "/favicon.ico",
      },
      ...getCanonicalLinks(env.VITE_BASE_URL),
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => <NotFoundError />,
  loader: async () => {
    const theme = await getThemeServerFn();
    return { theme };
  },
});

function RootComponent() {
  const { theme } = Route.useLoaderData();
  return (
    <ThemeProvider theme={theme.preference}>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ThemeProvider>
  );
}

function RootDocument({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { theme } = Route.useLoaderData();
  useSetSentryContext();

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <html
      lang="en"
      className={theme.resolved}
      data-hydrated={hydrated ? "true" : "false"}
    >
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="root">
          {children}
          <Toaster />
          <TanStackRouterDevtools position="bottom-left" />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </div>
        <Scripts />
      </body>
    </html>
  );
}
