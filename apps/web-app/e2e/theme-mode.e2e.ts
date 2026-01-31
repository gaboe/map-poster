import { expect, test } from "@playwright/test";
import { waitForHydration } from "./wait-for-hydration";
import { e2eEnv } from "./env";
import {
  ensureTestUserExists,
  signInWithEmail,
} from "./auth-helpers";

const testEmail = e2eEnv.E2E_TEST_EMAIL;
const testPassword = e2eEnv.E2E_TEST_PASSWORD;

test("theme: switching theme affects Base UI portals", async ({
  page,
}) => {
  await ensureTestUserExists(page.request, {
    email: testEmail,
    password: testPassword,
    name: "E2E Test User",
  });

  await signInWithEmail(page, {
    email: testEmail,
    password: testPassword,
  });

  await expect(
    page.getByRole("heading", {
      name: "Dashboard",
      exact: true,
    })
  ).toBeVisible({ timeout: 5_000 });

  // Ensure dashboard is hydrated so the toggle handlers are attached.
  await waitForHydration(page);

  const themeToggle = page.getByLabel("Toggle theme");

  // Force light first for deterministic snapshots.
  await themeToggle.click();
  await page
    .getByRole("menuitemradio", { name: "Light" })
    .click();
  await expect(page.locator("html")).not.toHaveClass(
    /dark/
  );

  await themeToggle.click();
  const popupLight = page.locator(
    '[data-slot="dropdown-menu-content"]'
  );
  await expect(popupLight).toBeVisible();
  const bgLight = await popupLight.evaluate(
    (el) => getComputedStyle(el).backgroundColor
  );
  await page
    .getByRole("menuitemradio", { name: "Dark" })
    .click();

  await expect(page.locator("html")).toHaveClass(/dark/);

  await themeToggle.click();
  const popupDark = page.locator(
    '[data-slot="dropdown-menu-content"]'
  );
  await expect(popupDark).toBeVisible();
  const bgDark = await popupDark.evaluate(
    (el) => getComputedStyle(el).backgroundColor
  );

  expect(bgDark).not.toBe(bgLight);
});
