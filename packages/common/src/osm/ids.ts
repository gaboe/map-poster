/**
 * OSM domain - Branded ID types
 */
import { Schema } from "effect";

/** Branded type for OSM data source IDs */
export const OsmDataSourceId = Schema.String.pipe(
  Schema.brand("OsmDataSourceId")
);
export type OsmDataSourceId = typeof OsmDataSourceId.Type;
