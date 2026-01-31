import type { ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import {
  createTRPCClient,
  httpBatchStreamLink,
  loggerLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import type { AppRouter } from "@/infrastructure/trpc/router";
import { getUrl } from "@/infrastructure/trpc/utils";
import { DefaultCatchBoundary } from "@/infrastructure/components/errors/default-catch-boundary";
import { NotFoundError } from "@/infrastructure/components/errors/not-found-error";
import { TRPCProvider } from "@/infrastructure/trpc/react";

const getRequestHeaders = createServerFn({
  method: "GET",
}).handler(async () => {
  const request = getRequest()!;
  const headers = new Headers(request.headers);
  const headersObj: Record<string, string> = {};
  headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  return headersObj;
});

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30 * 1000 },
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
  });

  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      loggerLink({
        enabled: (op) =>
          process.env.NODE_ENV === "development" ||
          (op.direction === "down" &&
            op.result instanceof Error),
      }),
      httpBatchStreamLink({
        transformer: superjson,
        url: getUrl(),
        async headers() {
          const requestHeaders = await getRequestHeaders();
          return {
            ...requestHeaders,
            // Bypass ngrok browser warning in development
            "ngrok-skip-browser-warning": "true",
          };
        },
      }),
    ],
  });

  const trpc = createTRPCOptionsProxy<AppRouter>({
    client: trpcClient,
    queryClient,
  });

  const router = createTanStackRouter({
    context: { queryClient, trpc },
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFoundError />,
    scrollRestoration: true,
    trailingSlash: "never",
    Wrap: (props: { children: ReactNode }) => {
      return (
        <TRPCProvider
          trpcClient={trpcClient}
          queryClient={queryClient}
        >
          {props.children}
        </TRPCProvider>
      );
    },
  });

  return routerWithQueryClient(router, queryClient);
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
