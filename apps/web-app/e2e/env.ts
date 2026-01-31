import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const e2eEnv = createEnv({
  server: {
    BASE_URL: z.url().default("http://localhost:3000"),
    E2E_TEST_EMAIL: z
      .email()
      .default("claude.code@map-poster.cz"),
    E2E_TEST_PASSWORD: z
      .string()
      .min(8)
      .default("TestPass123"),
  },
  runtimeEnv: process.env,
  isServer: true,
});
