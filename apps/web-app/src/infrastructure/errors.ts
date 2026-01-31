import { TRPCError } from "@trpc/server";

export const BAD_REQUEST_CODE = "BAD_REQUEST";

export const badRequestError = (
  message = "Bad request"
) => {
  return new TRPCError({
    code: BAD_REQUEST_CODE,
    message,
  });
};

export const UNAUTHORIZED_CODE = "UNAUTHORIZED";

export const unauthorizedError = (
  message = "Unauthorized"
) => {
  return new TRPCError({
    code: UNAUTHORIZED_CODE,
    message,
  });
};

export const FORBIDDEN_CODE = "FORBIDDEN";

export const forbiddenError = (message = "Forbidden") => {
  return new TRPCError({
    code: FORBIDDEN_CODE,
    message,
  });
};

export const NOT_FOUND_CODE = "NOT_FOUND";

export const notFoundError = (message = "Not found") => {
  return new TRPCError({
    code: NOT_FOUND_CODE,
    message,
  });
};

export const PAYMENT_REQUIRED_CODE = "PAYMENT_REQUIRED";

export const paymentRequiredError = (
  message = "Payment required"
) => {
  return new TRPCError({
    code: PAYMENT_REQUIRED_CODE,
    message,
  });
};

export const INTERNAL_SERVER_ERROR_CODE =
  "INTERNAL_SERVER_ERROR";

export const internalServerError = (
  message = "Internal server error"
) => {
  return new TRPCError({
    code: INTERNAL_SERVER_ERROR_CODE,
    message,
  });
};

// Expected TRPC error codes (user-facing, not bugs)
// These are normal business logic errors that should not create Sentry issues
export const EXPECTED_TRPC_CODES = [
  NOT_FOUND_CODE,
  FORBIDDEN_CODE,
  UNAUTHORIZED_CODE,
  BAD_REQUEST_CODE,
] as const;

export type ExpectedTRPCCode =
  (typeof EXPECTED_TRPC_CODES)[number];
