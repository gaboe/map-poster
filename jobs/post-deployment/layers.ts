import { Layer } from "effect";
import {
  Database,
  type Database as DatabaseContext,
} from "@map-poster/services";
import { connectDb } from "@map-poster/db";
import { env } from "./env";

/**
 * Post-deployment Services Layer
 * Combines all Effect-TS services with their dependencies
 */

// Database Layer - uses post-deployment specific DB connection
const DatabaseLive = Layer.succeed(
  Database,
  connectDb(env.DATABASE_URL)
);

// Combined services layer for post-deployment jobs
export const PostDeploymentServicesLive: Layer.Layer<DatabaseContext> =
  DatabaseLive;
