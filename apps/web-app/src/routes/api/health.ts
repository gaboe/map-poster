import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/infrastructure/db";
import { sql } from "drizzle-orm";

async function checkDatabase() {
  const startTime = Date.now();

  try {
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - startTime;
    return {
      status: "connected",
      latency,
      pool: {
        totalCount: db.$client.totalCount,
        idleCount: db.$client.idleCount,
        waitingCount: db.$client.waitingCount,
      },
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      status: "error",
      latency,
      error:
        error instanceof Error
          ? error.message
          : String(error),
      pool: {
        totalCount: db.$client.totalCount,
        idleCount: db.$client.idleCount,
        waitingCount: db.$client.waitingCount,
      },
    };
  }
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const startTime = Date.now();
        const database = await checkDatabase();
        const totalLatency = Date.now() - startTime;

        const healthStatus =
          database.status === "connected";

        const checks = {
          status: healthStatus ? "healthy" : "unhealthy",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: {
            heapUsed: Math.round(
              process.memoryUsage().heapUsed / 1024 / 1024
            ),
            heapTotal: Math.round(
              process.memoryUsage().heapTotal / 1024 / 1024
            ),
            rss: Math.round(
              process.memoryUsage().rss / 1024 / 1024
            ),
            external: Math.round(
              process.memoryUsage().external / 1024 / 1024
            ),
          },
          database,
          latency: totalLatency,
          version:
            process.env.npm_package_version || "unknown",
        };

        const statusCode = healthStatus ? 200 : 503;

        return new Response(JSON.stringify(checks), {
          status: statusCode,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control":
              "no-cache, no-store, must-revalidate",
          },
        });
      },
    },
  },
});
