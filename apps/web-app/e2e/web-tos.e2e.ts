import { expect, test } from "@playwright/test";

test("web: terms of service renders", async ({ page }) => {
  await page.goto("/tos");

  await expect(
    page.getByRole("heading", {
      name: "Terms of Service",
      exact: true,
    })
  ).toBeVisible();
});
