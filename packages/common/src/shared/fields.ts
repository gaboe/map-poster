/**
 * Shared field schemas used across multiple domains
 */
import { Schema } from "effect";

/** Email field with validation */
export const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: () => "Invalid email address",
  })
);

/** Password field with validation */
export const Password = Schema.String.pipe(
  Schema.minLength(8, {
    message: () => "Password must be at least 8 characters",
  })
);
