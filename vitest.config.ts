import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/__tests__/**/*.test.ts"],
    environment: "node",
    globals: false,
    clearMocks: true,
    restoreMocks: true,
    server: {
      deps: {
        inline: ["zod"],
      },
    },
    coverage: {
      provider: "istanbul",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/__tests__/**", "**/*.d.ts"],
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
  },
});
