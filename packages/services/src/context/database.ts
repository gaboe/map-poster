import { Context } from "effect";
import type { Db } from "@map-poster/db";

/** Database service identifier */
export interface DatabaseId {
  readonly _tag: "@map-poster/Database";
}

/** Database service providing access to the Drizzle ORM instance */
export const Database: Context.Tag<DatabaseId, Db> =
  Context.GenericTag<DatabaseId, Db>(
    "@map-poster/Database"
  );

/** Database service type (alias for convenience) */
export type Database = DatabaseId;
