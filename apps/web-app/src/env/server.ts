import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    BASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.url(),
    BREVO_API_KEY: z.string(),
    CONTACT_FORM_RECIPIENTS: z.string(),
    DATABASE_URL: z.string(),
    ENVIRONMENT: z.string(),
    MAP_POSTER_API_URL: z
      .string()
      .url()
      .default("http://localhost:8000"),
    SENTRY_DSN: z.url().or(z.literal("")).optional(),
    VERSION: z.string(),
  },
  runtimeEnv: process.env,
  isServer: true,
  // Skip validation during build/prerender (Vite sets this during build)
  skipValidation:
    typeof process !== "undefined" &&
    !!process.env.VITE_PRERENDER,
});
