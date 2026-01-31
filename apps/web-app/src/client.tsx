// src/client.tsx
import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { getRouter } from "./router";
import * as Sentry from "@sentry/tanstackstart-react";
import { env } from "@/env/client";
import { markExpectedTRPCErrorInEvent } from "@/infrastructure/sentry-utils";

const router = getRouter();

const isDev = env.VITE_ENVIRONMENT === "dev";
const sampleRate = isDev ? 1.0 : 0.001;

Sentry.init({
  ...(env.VITE_SENTRY_DSN && { dsn: env.VITE_SENTRY_DSN }),
  sendDefaultPii: true,
  environment: env.VITE_ENVIRONMENT,
  release: env.VITE_VERSION,
  dist: "client",
  spotlight: isDev,
  integrations: [
    Sentry.tanstackRouterBrowserTracingIntegration(router),
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      colorScheme: "system",
      autoInject: false,
    }),
    ...(isDev
      ? [Sentry.spotlightBrowserIntegration()]
      : []),
  ],
  _experiments: { enableLogs: true },
  tracesSampleRate: sampleRate,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event, hint) {
    return markExpectedTRPCErrorInEvent(
      event,
      hint.originalException
    );
  },
});

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>
);
