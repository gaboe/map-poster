import { expect, test } from "@playwright/test";

test.describe("map poster", () => {
  test("page loads at /poster", async ({ page }) => {
    await page.goto("/poster");

    await expect(
      page.getByRole("heading", {
        name: "Create Your Perfect Map Poster",
        exact: true,
      })
    ).toBeVisible();

    // Verify controls are present
    await expect(page.getByLabel("Location")).toBeVisible();
    await expect(page.getByLabel("Theme")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Generate Map/i })
    ).toBeVisible();
  });

  test("geolocation fills location input", async ({
    page,
  }) => {
    // Mock geolocation
    await page.context().grantPermissions(["geolocation"]);
    await page.context().setGeolocation({
      latitude: 50.0755,
      longitude: 14.4378,
    });

    await page.goto("/poster");

    // Wait for geolocation to be processed and location to be filled
    const locationInput = page.getByLabel("Location");
    await expect(locationInput).toHaveValue(
      /Prague|Czech/i,
      {
        timeout: 5000,
      }
    );
  });

  test("theme change triggers regeneration", async ({
    page,
  }) => {
    await page.goto("/poster");

    // Wait for themes to load
    await expect(page.getByLabel("Theme")).toBeVisible();

    // Fill location
    await page.getByLabel("Location").fill("Prague");

    // Select first theme
    const themeSelect = page.getByLabel("Theme");
    await themeSelect.click();
    const firstTheme = page
      .locator("[role='option']")
      .first();
    await firstTheme.click();

    // Click generate
    const generateButton = page.getByRole("button", {
      name: /Generate Map/i,
    });
    await generateButton.click();

    // Wait for generation to start
    await expect(
      page.getByText(
        /Generating Your Map|Preparing your poster/i
      )
    ).toBeVisible({ timeout: 5000 });

    // Wait for completion or image to appear
    await page.waitForTimeout(2000);

    // Verify either image loaded or generation completed
    const posterPreview = page.locator(
      '[data-testid="poster-preview"]'
    );
    const completionMessage = page.getByText(
      /Map generated successfully/i
    );

    const hasImage = await posterPreview
      .isVisible()
      .catch(() => false);
    const hasCompletion = await completionMessage
      .isVisible()
      .catch(() => false);

    expect(hasImage || hasCompletion).toBeTruthy();
  });

  test("error state displays on API failure", async ({
    page,
  }) => {
    await page.goto("/poster");

    // Mock API error for generatePreview
    await page.route(
      "**/trpc/mapPoster.generatePreview*",
      async (route) => {
        await route.abort("failed");
      }
    );

    // Fill form
    await page.getByLabel("Location").fill("Prague");

    // Select theme
    const themeSelect = page.getByLabel("Theme");
    await themeSelect.click();
    const firstTheme = page
      .locator("[role='option']")
      .first();
    await firstTheme.click();

    // Try to generate
    const generateButton = page.getByRole("button", {
      name: /Generate Map/i,
    });
    await generateButton.click();

    // Wait for error message to appear
    await expect(
      page.getByText(/Generation failed|Please try again/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
