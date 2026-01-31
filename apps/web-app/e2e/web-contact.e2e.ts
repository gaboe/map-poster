import { expect, test } from "@playwright/test";

test("web: contact page renders", async ({ page }) => {
  await page.goto("/contact");

  await expect(
    page.getByRole("heading", {
      name: "Contact Us",
      exact: true,
    })
  ).toBeVisible();

  await expect(
    page.getByText("Send us a message", { exact: true })
  ).toBeVisible();
});
