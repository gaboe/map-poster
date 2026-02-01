import type { TRPCRouterRecord } from "@trpc/server";
import { Schema } from "effect";
import { publicProcedure } from "@/infrastructure/trpc/procedures/auth";
import { env } from "@/env/server";
import {
  badRequestError,
  internalServerError,
  notFoundError,
} from "@/infrastructure/errors";

export const router = {
  generatePreview: publicProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          lat: Schema.Number.pipe(
            Schema.between(-90, 90, {
              message: () =>
                "Latitude must be between -90 and 90",
            })
          ),
          lon: Schema.Number.pipe(
            Schema.between(-180, 180, {
              message: () =>
                "Longitude must be between -180 and 180",
            })
          ),
          theme: Schema.String.pipe(
            Schema.minLength(1, {
              message: () => "Theme is required",
            })
          ),
        })
      )
    )
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(
          `${env.MAP_POSTER_API_URL}/api/generate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat: input.lat,
              lon: input.lon,
              theme: input.theme,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({}));
          const errorMessage =
            (errorData as Record<string, unknown>).detail ||
            "Failed to generate preview";
          throw badRequestError(String(errorMessage));
        }

        const data = (await response.json()) as {
          job_id: string;
        };
        return {
          jobId: data.job_id,
        };
      } catch (error) {
        if (error instanceof Error && error.message) {
          throw error;
        }
        throw internalServerError(
          "Failed to generate preview"
        );
      }
    }),

  getStatus: publicProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          jobId: Schema.String.pipe(
            Schema.minLength(1, {
              message: () => "Job ID is required",
            })
          ),
        })
      )
    )
    .query(async ({ input }) => {
      try {
        const response = await fetch(
          `${env.MAP_POSTER_API_URL}/api/jobs/${input.jobId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw notFoundError("Job not found");
          }
          const errorData = await response
            .json()
            .catch(() => ({}));
          const errorMessage =
            (errorData as Record<string, unknown>).detail ||
            "Failed to get job status";
          throw badRequestError(String(errorMessage));
        }

        const data = (await response.json()) as {
          status: string;
          progress: number;
          url?: string;
        };
        return {
          status: data.status as
            | "pending"
            | "processing"
            | "completed"
            | "failed",
          progress: data.progress,
          url: data.url ?? null,
        };
      } catch (error) {
        if (error instanceof Error && error.message) {
          throw error;
        }
        throw internalServerError(
          "Failed to get job status"
        );
      }
    }),

  listThemes: publicProcedure.query(async () => {
    try {
      const response = await fetch(
        `${env.MAP_POSTER_API_URL}/api/themes`,
        {
          method: "GET",
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
          "Failed to fetch themes";
        throw badRequestError(String(errorMessage));
      }

      const data = (await response.json()) as Array<{
        name: string;
        id: string;
      }>;
      return data;
    } catch (error) {
      if (error instanceof Error && error.message) {
        throw error;
      }
      throw internalServerError("Failed to fetch themes");
    }
  }),
} satisfies TRPCRouterRecord;
