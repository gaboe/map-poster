import { expect, test } from "@playwright/test";
import { e2eEnv } from "./env";
import {
  ensureTestUserExists,
  signInWithEmail,
} from "./auth-helpers";

const testEmail = e2eEnv.E2E_TEST_EMAIL;
const testPassword = e2eEnv.E2E_TEST_PASSWORD;

test("auth: can sign in with email", async ({ page }) => {
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
});
