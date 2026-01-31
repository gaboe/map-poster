import { expect } from "@playwright/test";
import type {
  APIRequestContext,
  Page,
} from "@playwright/test";
import { waitForHydration } from "./wait-for-hydration";

export type EnsureTestUserOptions = {
  email: string;
  password: string;
  name: string;
};

export type SignInOptions = {
  email: string;
  password: string;
};

export async function ensureTestUserExists(
  request: APIRequestContext,
  options: EnsureTestUserOptions
) {
  const signUpResponse = await request.post(
    "/api/auth/sign-up/email",
    {
      data: {
        email: options.email,
        password: options.password,
        name: options.name,
      },
    }
  );

  if (signUpResponse.ok()) {
    return;
  }

  const body = await signUpResponse.text().catch(() => "");

  if (body.toLowerCase().includes("already")) {
    return;
  }

  throw new Error(
    `Sign-up failed (${signUpResponse.status()}): ${body}`
  );
}

export async function signInWithEmail(
  page: Page,
  options: SignInOptions
) {
  async function gotoSignInAndFill() {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    // Wait for client hydration so the form submit handler is attached.
    await waitForHydration(page);

    await expect(
      page.getByText("Welcome back")
    ).toBeVisible();

    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Password");

    await emailInput.fill(options.email);
    await expect(emailInput).toHaveValue(options.email);

    await passwordInput.fill(options.password);
    await expect(passwordInput).toHaveValue(
      options.password
    );
  }

  await gotoSignInAndFill();

  const signInButton = page.getByRole("button", {
    name: "Sign In",
    exact: true,
  });

  await expect(signInButton).toBeEnabled({
    timeout: 5_000,
  });

  let signInSucceeded = false;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const signInResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/auth/sign-in/email") &&
        res.request().method() === "POST",
      { timeout: 5_000 }
    );

    await signInButton.click();

    const response = await signInResponsePromise.catch(
      () => null
    );

    if (response?.ok()) {
      signInSucceeded = true;
      break;
    }

    // If hydration was not ready, the browser might have performed a native
    // form submit and navigated to `/sign-in?...`. Reset and retry once.
    await gotoSignInAndFill();
  }

  expect(signInSucceeded).toBe(true);

  await expect(page).toHaveURL(/\/app\/dashboard/, {
    timeout: 10_000,
  });
}
