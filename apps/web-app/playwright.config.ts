import { defineConfig } from "@playwright/test";

const baseURL =
  process.env["BASE_URL"] ?? "http://localhost:3000";
const isCI = !!process.env["CI"];
const suite = process.env["E2E_SUITE"] ?? "full";

const testMatch =
  suite === "prod"
    ? [
        "**/web-home.e2e.ts",
        "**/web-contact.e2e.ts",
        "**/web-newsroom.e2e.ts",
        "**/web-privacy-policy.e2e.ts",
        "**/web-tos.e2e.ts",
        "**/auth-signup.e2e.ts",
      ]
    : "**/*.e2e.ts";

export default defineConfig({
  testDir: "./e2e",
  testMatch,
  timeout: 15_000,
  retries: isCI ? 1 : 0,
  ...(isCI ? { workers: 1 } : {}),
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  reporter: isCI
    ? [
        ["list"],
        [
          "junit",
          {
            outputFile:
              "test-results/e2e-junit-results.xml",
          },
        ],
        [
          "html",
          {
            outputFolder: "playwright-report",
            open: "never",
          },
        ],
      ]
    : "list",
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
