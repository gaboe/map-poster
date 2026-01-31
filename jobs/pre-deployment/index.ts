#!/usr/bin/env bun

/**
 * Pre-deployment job orchestrator
 *
 * This script runs various pre-deployment tasks before each release.
 * Add new jobs here as needed.
 */

import { dbMigrate } from "./db-migrate.js";

async function main() {
  console.log(
    "🚀 [PRE-DEPLOYMENT] Starting pre-deployment jobs"
  );

  const jobs = [
    {
      name: "Database Migration",
      fn: dbMigrate,
    },
    // Add more jobs here as needed
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const job of jobs) {
    try {
      console.log(
        `\n📋 [PRE-DEPLOYMENT] Running job: ${job.name}`
      );
      await job.fn();
      console.log(
        `✅ [PRE-DEPLOYMENT] Job completed: ${job.name}`
      );
      successCount++;
    } catch (error) {
      console.error(
        `❌ [PRE-DEPLOYMENT] Job failed: ${job.name}`,
        error
      );
      failureCount++;

      // Fail fast - exit on first error
      console.error(
        `💥 [PRE-DEPLOYMENT] Aborting due to job failure: ${job.name}`
      );
      process.exit(1);
    }
  }

  console.log(
    `\n🎉 [PRE-DEPLOYMENT] All jobs completed successfully!`
  );
  console.log(
    `📊 [PRE-DEPLOYMENT] Summary: ${successCount} succeeded, ${failureCount} failed`
  );

  process.exit(0);
}

// Run if this script is executed directly
if (import.meta.main) {
  void main();
}
