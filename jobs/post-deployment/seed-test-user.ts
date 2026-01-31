import { connectDb, usersTable } from "@map-poster/db";
import { eq } from "drizzle-orm";
import { env } from "./env";

const TEST_USER_EMAIL = "claude.code@map-poster.cz";
const TEST_USER_NAME = "Claude Code";
const TEST_USER_PASSWORD = "TestPass123";

export async function seedTestUser(): Promise<void> {
  if (env.ENVIRONMENT !== "test") {
    console.log(
      `[POST-DEPLOYMENT] Skipping test user seed (ENVIRONMENT=${env.ENVIRONMENT})`
    );
    return;
  }

  const db = connectDb(env.DATABASE_URL);

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, TEST_USER_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log(
      `[POST-DEPLOYMENT] Test user already exists: ${TEST_USER_EMAIL}`
    );
    return;
  }

  const signUpUrl = new URL(
    "/api/auth/sign-up/email",
    env.INTERNAL_BASE_URL
  ).toString();

  console.log(
    `[POST-DEPLOYMENT] Creating test user via Better Auth: ${TEST_USER_EMAIL}`
  );

  const response = await fetch(signUpUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      name: TEST_USER_NAME,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `[POST-DEPLOYMENT] Failed to seed test user (${response.status}): ${body}`
    );
  }

  console.log(
    `[POST-DEPLOYMENT] Test user created: ${TEST_USER_EMAIL}`
  );
}
