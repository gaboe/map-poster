import { createId } from "@paralleldrive/cuid2";
import type { UserId } from "@map-poster/common";
import { usersTable } from "../schema";
import type { TestDb } from "./setup";

type CreateUserOptions = {
  name?: string;
  email?: string;
};

export async function seedUser(
  db: TestDb,
  options: CreateUserOptions = {}
): Promise<typeof usersTable.$inferSelect> {
  const id = createId() as UserId;
  const [user] = await db
    .insert(usersTable)
    .values({
      id,
      name: options.name ?? "Test User",
      email: options.email ?? `test-${id}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!user) throw new Error("Failed to create user");
  return user;
}
