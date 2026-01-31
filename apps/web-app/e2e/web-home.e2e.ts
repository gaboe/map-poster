import { expect, test } from "@playwright/test";

test("web: homepage renders", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "This is a map-poster",
      exact: true,
    })
  ).toBeVisible();
});
