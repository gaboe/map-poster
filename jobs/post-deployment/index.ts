#!/usr/bin/env bun

/**
 * Post-deployment job orchestrator
 *
 * This script runs various post-deployment tasks after each release.
 * Add new jobs here as needed.
 */

import { seedTestUser } from "./seed-test-user";

async function main() {
  const startTime = Date.now();
  console.log(
    "🚀 [POST-DEPLOYMENT] Starting post-deployment jobs"
  );

  const jobs = [
    {
      name: "seed-test-user",
      fn: seedTestUser,
    },
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const job of jobs) {
    try {
      console.log(
        `\n📋 [POST-DEPLOYMENT] Running job: ${job.name}`
      );
      await job.fn();
      console.log(
        `✅ [POST-DEPLOYMENT] Job completed: ${job.name}`
      );
      successCount++;
    } catch (error) {
      console.error(
        `❌ [POST-DEPLOYMENT] Job failed: ${job.name}`,
        error
      );
      failureCount++;

      // Fail fast - exit on first error
      console.error(
        `💥 [POST-DEPLOYMENT] Aborting due to job failure: ${job.name}`
      );
      process.exit(1);
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(
    `\n🎉 [POST-DEPLOYMENT] All jobs completed successfully!`
  );
  console.log(
    `📊 [POST-DEPLOYMENT] Summary: ${successCount} succeeded, ${failureCount} failed`
  );
  console.log(
    `⏱️ [POST-DEPLOYMENT] Total execution time: ${duration}ms (${(duration / 1000).toFixed(1)}s)`
  );

  process.exit(0);
}

// Run if this script is executed directly
if (import.meta.main) {
  void main();
}
