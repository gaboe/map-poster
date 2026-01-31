import { createServerFn } from "@tanstack/react-start";
import {
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { Option, Schema } from "effect";

export type SortPreference = "popularity" | "alphabetical";

export type SortSection =
  | "project"
  | "integrations"
  | "organization"
  | "dashboard"
  | "platform-docs";

const SortPreferenceSchema = Schema.Literal(
  "popularity",
  "alphabetical"
);

const SortSectionSchema = Schema.Literal(
  "project",
  "integrations",
  "organization",
  "dashboard",
  "platform-docs"
);

const SetSortPreferenceSchema = Schema.Struct({
  section: SortSectionSchema,
  preference: SortPreferenceSchema,
});

const SORT_PREFERENCE_COOKIE_PREFIX = "sort-preference-";

const decodeSortSection = Schema.decodeUnknownSync(
  SortSectionSchema
);
const decodeSortPreference = Schema.decodeUnknownOption(
  SortPreferenceSchema
);
const decodeSetSortPreference = Schema.decodeUnknownSync(
  SetSortPreferenceSchema
);

export const getSortPreferenceServerFn = createServerFn({
  method: "GET",
})
  .inputValidator((data: unknown) => {
    return decodeSortSection(data);
  })
  .handler(async ({ data: section }) => {
    const cookieName = `${SORT_PREFERENCE_COOKIE_PREFIX}${section}`;
    const cookieValue = getCookie(cookieName);

    // Validate cookie value or return default
    if (cookieValue) {
      return Option.getOrElse(
        decodeSortPreference(cookieValue),
        () => "popularity" as SortPreference
      );
    }

    return "popularity" as SortPreference;
  });

export const setSortPreferenceServerFn = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) => {
    return decodeSetSortPreference(data);
  })
  .handler(async ({ data }) => {
    const { section, preference } = data;
    const cookieName = `${SORT_PREFERENCE_COOKIE_PREFIX}${section}`;

    try {
      setCookie(cookieName, preference);
    } catch (error) {
      console.error(
        "Failed to set sort preference cookie",
        {
          error,
          cookieName,
          preference,
        }
      );
      throw new Error("Failed to save sort preference");
    }
  });
