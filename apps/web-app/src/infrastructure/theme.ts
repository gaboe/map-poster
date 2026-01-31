import { createServerFn } from "@tanstack/react-start";
import {
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { Schema } from "effect";

const storageKey = "map-poster-theme-ui";

const ThemeSchema = Schema.Struct({
  preference: Schema.optionalWith(
    Schema.Literal("light", "dark", "system"),
    { default: () => "system" as const }
  ),
  lastSystemTheme: Schema.optional(
    Schema.Literal("light", "dark")
  ),
});

const decodeTheme = Schema.decodeUnknownSync(ThemeSchema);

export const getThemeServerFn = createServerFn().handler(
  async () => {
    const parsedCookie = decodeTheme(
      JSON.parse(getCookie(storageKey) || "{}")
    );

    return {
      preference: parsedCookie.preference,
      resolved:
        parsedCookie.preference === "dark" ||
        (parsedCookie.preference === "system" &&
          parsedCookie.lastSystemTheme === "dark")
          ? "dark"
          : "light",
    };
  }
);

export const setThemeServerFn = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) => {
    return decodeTheme(data);
  })
  .handler(async ({ data }) => {
    setCookie(storageKey, JSON.stringify(data));
  });
