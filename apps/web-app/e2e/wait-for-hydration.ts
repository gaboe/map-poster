import type { Page } from "@playwright/test";

export type WaitForHydrationOptions = {
  timeout?: number;
};

export async function waitForHydration(
  page: Page,
  options: WaitForHydrationOptions = {}
) {
  const timeout = options.timeout ?? 5_000;

  await page.waitForSelector('html[data-hydrated="true"]', {
    timeout,
  });
}
