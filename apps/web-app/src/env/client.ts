import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_BASE_URL: z.url(),
    VITE_BETTER_AUTH_URL: z.url(),
    VITE_ENVIRONMENT: z.string(),
    VITE_SENTRY_DSN: z.url().or(z.literal("")).optional(),
    VITE_VERSION: z.string(),
  },
  runtimeEnv: import.meta.env,
  isServer: false,
});
