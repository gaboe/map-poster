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
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
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
