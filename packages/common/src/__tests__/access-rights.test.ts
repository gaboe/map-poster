import { Schema } from "effect";
import { describe, expect, test } from "vitest";

import {
  InvitationStatusSchema,
  OrganizationRoleSchema,
} from "../access-rights/models";

describe("access-rights schemas", () => {
  test("OrganizationRoleSchema accepts only known roles", () => {
    const decode = Schema.decodeUnknownEither(
      OrganizationRoleSchema
    );

    expect(decode("owner")._tag).toBe("Right");
    expect(decode("admin")._tag).toBe("Right");
    expect(decode("member")._tag).toBe("Right");

    expect(decode("superadmin")._tag).toBe("Left");
  });

  test("InvitationStatusSchema accepts only known statuses", () => {
    const decode = Schema.decodeUnknownEither(
      InvitationStatusSchema
    );

    expect(decode("pending")._tag).toBe("Right");
    expect(decode("accepted")._tag).toBe("Right");
    expect(decode("dismissed")._tag).toBe("Right");

    expect(decode("expired")._tag).toBe("Left");
  });
});
