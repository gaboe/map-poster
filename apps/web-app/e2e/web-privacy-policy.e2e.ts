import { expect, test } from "@playwright/test";

test("web: privacy policy renders", async ({ page }) => {
  await page.goto("/privacy-policy");

  await expect(
    page.getByRole("heading", {
      name: "Privacy Policy",
      exact: true,
    })
  ).toBeVisible();
});
