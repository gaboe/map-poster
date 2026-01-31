import { createFileRoute } from "@tanstack/react-router";

import { auth } from "@/auth/auth";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
});

async function handleAuthRequest(request: Request) {
  return auth.handler(request);
}
