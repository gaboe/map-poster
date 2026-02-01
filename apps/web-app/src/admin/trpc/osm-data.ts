import { adminProcedure } from "@/infrastructure/trpc/procedures/auth";
import { Schema } from "effect";
import { env } from "@/env/server";
import {
  badRequestError,
  internalServerError,
  notFoundError,
} from "@/infrastructure/errors";
import { eq, asc } from "drizzle-orm";
import { osmDataSourcesTable } from "@map-poster/db";

export const router = {
  list: adminProcedure.query(async ({ ctx: { db } }) => {
    return db
      .select()
      .from(osmDataSourcesTable)
      .orderBy(asc(osmDataSourcesTable.code));
  }),

  startImport: adminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          sourceCode: Schema.Literal("cz", "sk"),
        })
      )
    )
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(
          `${env.MAP_POSTER_API_URL}/api/admin/osm/import/${input.sourceCode}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({}));
          const errorMessage =
            (errorData as Record<string, unknown>).detail ||
            "Failed to start import";
          throw badRequestError(String(errorMessage));
        }

        return {
          success: true,
          sourceCode: input.sourceCode,
        };
      } catch (error) {
        if (error instanceof Error && error.message) {
          throw error;
        }
        throw internalServerError("Failed to start import");
      }
    }),

  getStatus: adminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          sourceCode: Schema.Literal("cz", "sk"),
        })
      )
    )
    .query(async ({ ctx: { db }, input }) => {
      const source = await db
        .select()
        .from(osmDataSourcesTable)
        .where(
          eq(osmDataSourcesTable.code, input.sourceCode)
        )
        .limit(1);

      if (!source[0]) {
        throw notFoundError("Source not found");
      }

      return source[0];
    }),
};
