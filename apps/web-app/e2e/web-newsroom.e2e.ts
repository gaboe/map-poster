import { expect, test } from "@playwright/test";

test("web: newsroom renders", async ({ page }) => {
  await page.goto("/newsroom");

  await expect(
    page.getByRole("heading", {
      name: "Newsroom",
      exact: true,
    })
  ).toBeVisible();
});
