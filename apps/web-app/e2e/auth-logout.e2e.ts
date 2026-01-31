import { expect, test } from "@playwright/test";
import { waitForHydration } from "./wait-for-hydration";
import { e2eEnv } from "./env";
import { ensureTestUserExists } from "./auth-helpers";

const testEmail = e2eEnv.E2E_TEST_EMAIL;
const testPassword = e2eEnv.E2E_TEST_PASSWORD;

const baseURL = e2eEnv.BASE_URL;

type ParsedCookie = {
  name: string;
  value: string;
  path: string;
};

function parseSetCookie(cookie: string): ParsedCookie {
  const parts = cookie.split(";").map((p) => p.trim());
  const [nameValue, ...attrs] = parts;

  if (!nameValue) {
    throw new Error(`Invalid set-cookie header: ${cookie}`);
  }

  const eqIndex = nameValue.indexOf("=");
  const name = nameValue.slice(0, eqIndex);
  const value = nameValue.slice(eqIndex + 1);

  const pathAttr = attrs.find((a) =>
    a.toLowerCase().startsWith("path=")
  );
  const path = pathAttr
    ? pathAttr.slice("path=".length)
    : "/";

  return { name, value, path };
}

test("auth: can log out from sidebar menu", async ({
  page,
}) => {
  await ensureTestUserExists(page.request, {
    email: testEmail,
    password: testPassword,
    name: "E2E Test User",
  });

  // Sign in via API and inject cookies.
  const signInResponse = await page.request.post(
    "/api/auth/sign-in/email",
    {
      data: {
        email: testEmail,
        password: testPassword,
        callbackURL: "/app/dashboard",
      },
    }
  );

  if (!signInResponse.ok()) {
    const body = await signInResponse
      .text()
      .catch(() => "");
    throw new Error(
      `Sign-in failed (${signInResponse.status()}): ${body}`
    );
  }

  const setCookieHeaders = signInResponse
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value);

  if (setCookieHeaders.length === 0) {
    const body = await signInResponse
      .text()
      .catch(() => "");
    throw new Error(
      `Sign-in returned no Set-Cookie headers: ${body}`
    );
  }

  await page.context().addCookies(
    setCookieHeaders.map((raw) => {
      const parsed = parseSetCookie(raw);
      return {
        name: parsed.name,
        value: parsed.value,
        url: new URL(parsed.path, baseURL).toString(),
      };
    })
  );

  await page.goto("/app/dashboard");
  await page.waitForLoadState("networkidle");
  await waitForHydration(page);

  await expect(
    page.getByRole("heading", {
      name: "Dashboard",
      exact: true,
    })
  ).toBeVisible({ timeout: 5_000 });

  const logoutButton = page.getByRole("button", {
    name: "Log out",
    exact: true,
  });

  // Ensure the click is handled by the hydrated client by waiting for the
  // real sign-out network call.
  const signOutResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/auth/sign-out") &&
      res.request().method() === "POST",
    { timeout: 5_000 }
  );

  await logoutButton.click();
  await signOutResponsePromise;

  await expect(page).toHaveURL(/\/sign-in/, {
    timeout: 10_000,
  });
  await expect(page.getByText("Welcome back")).toBeVisible({
    timeout: 5_000,
  });

  // Verify session is gone: protected route redirects back.
  await page.goto("/app/dashboard");
  await expect(page).toHaveURL(/\/sign-in/, {
    timeout: 10_000,
  });
});
