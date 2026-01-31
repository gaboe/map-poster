import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required"),
  ENVIRONMENT: z.enum(["prod", "test"]).optional(),
  INTERNAL_BASE_URL: z.url({
    message: "INTERNAL_BASE_URL must be a valid URL",
  }),
});

const parsed = envSchema.parse(process.env);

const env = {
  ...parsed,
  ENVIRONMENT: parsed.ENVIRONMENT ?? "prod",
} as const;

export { env };
