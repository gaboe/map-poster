import { Schema } from "effect";

export const UserId = Schema.String.pipe(
  Schema.brand("UserId")
);
export type UserId = typeof UserId.Type;

export const UserRoleSchema = Schema.Literal(
  "admin",
  "user"
);
export type UserRoleValue = typeof UserRoleSchema.Type;
