import { Schema } from "effect";

const OptionalSearchParamSchema = Schema.transform(
  Schema.Union(
    Schema.String,
    Schema.Array(Schema.String),
    Schema.Undefined
  ),
  Schema.UndefinedOr(Schema.String),
  {
    strict: true,
    decode: (value) => {
      if (typeof value === "string") {
        return value;
      }

      if (Array.isArray(value)) {
        const [first] = value;
        return typeof first === "string"
          ? first
          : undefined;
      }

      return undefined;
    },
    encode: (value) => value,
  }
);

const searchParamSchema = (defaultValue: string) =>
  Schema.transform(
    Schema.Union(
      Schema.String,
      Schema.Array(Schema.String),
      Schema.Undefined
    ),
    Schema.String,
    {
      strict: true,
      decode: (value) => {
        if (typeof value === "string") {
          return value;
        }

        if (Array.isArray(value)) {
          const [first] = value;
          return typeof first === "string"
            ? first
            : defaultValue;
        }

        return defaultValue;
      },
      encode: (value) => value,
    }
  );

export const OAuthAuthorizationSearchSchema = Schema.Struct(
  {
    response_type: Schema.optional(
      OptionalSearchParamSchema
    ),
    client_id: Schema.optional(OptionalSearchParamSchema),
    redirect_uri: Schema.optional(
      OptionalSearchParamSchema
    ),
    scope: Schema.optional(OptionalSearchParamSchema),
    state: Schema.optional(OptionalSearchParamSchema),
    code_challenge: Schema.optional(
      OptionalSearchParamSchema
    ),
    code_challenge_method: Schema.optional(
      OptionalSearchParamSchema
    ),
  }
);

export const OAuthConsentSearchSchema = Schema.Struct({
  client_id: Schema.optional(searchParamSchema("")),
  redirect_uri: Schema.optional(searchParamSchema("")),
  response_type: Schema.optional(searchParamSchema("code")),
  scope: Schema.optional(searchParamSchema("")),
  state: Schema.optional(searchParamSchema("")),
  code_challenge: Schema.optional(searchParamSchema("")),
  code_challenge_method: Schema.optional(
    searchParamSchema("S256")
  ),
  resource: Schema.optional(OptionalSearchParamSchema),
});

export type OAuthAuthorizationSearchParams =
  Schema.Schema.Type<typeof OAuthAuthorizationSearchSchema>;

export type OAuthConsentSearchParams = Schema.Schema.Type<
  typeof OAuthConsentSearchSchema
>;
