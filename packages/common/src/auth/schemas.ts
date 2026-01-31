/**
 * Auth domain - Input/Output schemas
 */
import { Schema } from "effect";

import { Email, Password } from "../shared/fields";

// =============================================================================
// Input Schemas
// =============================================================================

/** Schema for sign in */
export const SignInInput = Schema.Struct({
  email: Email,
  password: Password,
  rememberMe: Schema.optional(Schema.Boolean),
});
export type SignInInput = typeof SignInInput.Type;

/** Schema for sign up */
export const SignUpInput = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, {
      message: () => "Name is required",
    })
  ),
  email: Email,
  password: Password,
});
export type SignUpInput = typeof SignUpInput.Type;
