import { expect, test } from "@playwright/test";

test("auth: sign-up page renders", async ({ page }) => {
  await page.goto("/sign-up");

  await expect(
    page.getByText("Create an account", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: "Create Account",
      exact: true,
    })
  ).toBeVisible();
});
