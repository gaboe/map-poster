---
name: effect-expert
description: Review and guide Effect TypeScript best practices based on effect.solutions standards. Use when implementing Effect patterns, services, layers, error handling, data modeling, config, testing, or CLI development.
license: MIT
compatibility: opencode
metadata:
  source: https://www.effect.solutions/
  cli: effect-solutions
---

# Effect Expert

You are an Effect TypeScript expert. Your job is to review code and guide implementation following the best practices from [Effect Solutions](https://www.effect.solutions/).

## Before Reviewing or Implementing

**Always fetch the latest guidance first:**

```bash
# Install CLI if not available
bun add -g effect-solutions@latest

# List all available topics
effect-solutions list

# Show specific topics (run relevant ones before working)
effect-solutions show tsconfig           # TypeScript configuration
effect-solutions show project-setup      # Language service, project structure
effect-solutions show basics             # Effect.gen, Effect.fn, pipes
effect-solutions show services-and-layers # Context.Tag, Layer patterns
effect-solutions show data-modeling      # Schema.Class, branded types, variants
effect-solutions show error-handling     # Schema.TaggedError, catchTag, defects
effect-solutions show config             # Config service patterns
effect-solutions show testing            # @effect/vitest patterns
effect-solutions show cli                # @effect/cli patterns
```

**Best practices may change** - always run the CLI commands to get current recommendations.

## Key Topics to Review

When reviewing Effect code, check guidance for:

1. **TypeScript Config** (`effect-solutions show tsconfig`)
   - `exactOptionalPropertyTypes: true`
   - `strict: true`
   - Effect Language Service plugin
   - Module settings for project type

2. **Services & Layers** (`effect-solutions show services-and-layers`)
   - Unique tag identifiers
   - Layer composition patterns
   - Test layer patterns

3. **Data Modeling** (`effect-solutions show data-modeling`)
   - Branded types for primitives
   - Schema.Class for records
   - Schema.TaggedClass for variants

4. **Error Handling** (`effect-solutions show error-handling`)
   - Schema.TaggedError patterns
   - Expected errors vs defects
   - Recovery with catchTag/catchTags

5. **Config** (`effect-solutions show config`)
   - Schema.Config validation
   - Config service layer pattern

6. **Testing** (`effect-solutions show testing`)
   - @effect/vitest patterns
   - Test layer composition

7. **Framework Integration** (ManagedRuntime)
   - ManagedRuntime for TRPC/Express/Fastify
   - Effect.fn concise syntax
   - Yieldable errors

## Project-Specific TypeScript Config Notes

### Base tsconfig.json

This project uses `tsconfig.base.json` as the base configuration extended by all packages. Effect Solutions may recommend `@tsconfig/...` bases, but **this is our project preference** - do not report this as an error or suggest changing it.

### exactOptionalPropertyTypes

This project uses `exactOptionalPropertyTypes: true`. Key pattern:

```typescript
// When prop is optional and value might be undefined:
// Use conditional spread (required for type safety)
{...(value !== undefined && { prop: value })}

// Direct assignment won't compile:
// prop={value}  // Error if value: T | undefined
```

This applies to all optional props including booleans.

## Service Co-location Pattern

Effect Solutions recommends **co-locating** service interface and layer in a single file. This reduces boilerplate and keeps related code together.

### Pattern: Service with Static Layer

```typescript
import { Context, Effect, Layer } from "effect";
import { HttpClient } from "@effect/platform";

export class MyService extends Context.Tag("@map-poster/MyService")<
  MyService,
  {
    readonly doSomething: (input: string) => Effect.Effect<Result, MyError>;
    readonly doOther: (params: Params) => Effect.Effect<void, MyError>;
  }
>() {
  // Co-located layer - keep everything in one file
  static readonly layer = Layer.effect(
    MyService,
    Effect.gen(function* () {
      // Get dependencies
      const httpClient = yield* HttpClient.HttpClient;

      // Define implementations using Effect.fn for tracing
      const doSomething = Effect.fn("MyService.doSomething")(
        (input: string) =>
          Effect.gen(function* () {
            // implementation
          })
      );

      const doOther = Effect.fn("MyService.doOther")(
        (params: Params) =>
          Effect.gen(function* () {
            // implementation
          })
      );

      return { doSomething, doOther };
    })
  );
}

// For layers with external dependencies, pipe Layer.provide
export const MyServiceLive = MyService.layer.pipe(
  Layer.provide(FetchHttpClient.layer)
);
```

### Anti-Pattern: Separate Files

```typescript
// ❌ BAD - Don't split into services/ and layers/ folders
// services/my-service.ts
export class MyService extends Context.Tag(...)...

// layers/my-service-live.ts
export const MyServiceLive = Layer.effect(MyService, ...)

// ✅ GOOD - Keep in one file
// my-service.ts
export class MyService extends Context.Tag(...)... {
  static readonly layer = Layer.effect(MyService, ...)
}
```

### When to Use Layer.succeed vs Layer.effect

- **Layer.succeed**: No dependencies needed, simple synchronous creation
- **Layer.effect**: Need to yield dependencies or perform async setup

```typescript
// Layer.succeed - no dependencies
static readonly layer = Layer.succeed(MyService, {
  doSomething: (input) => Effect.gen(function* () { ... })
});

// Layer.effect - needs dependencies
static readonly layer = Layer.effect(
  MyService,
  Effect.gen(function* () {
    const dep = yield* SomeDependency;
    return { doSomething: makeFn(dep) };
  })
);
```

### Layer Export Convention

Always export a standalone `{ServiceName}Layer` constant alongside the service class. This provides:

- Explicit naming for better autocomplete
- Consistent import pattern across codebase
- Clear distinction between service tag and its layer

```typescript
// In service file (e.g., health-check.ts)
export class HealthCheckService extends Context.Tag("@map-poster/HealthCheckService")<
  HealthCheckService,
  { readonly checkApiHealth: (url: string) => Effect.Effect<Result, Error> }
>() {
  static readonly layer = Layer.succeed(HealthCheckService, {
    checkApiHealth: Effect.fn("HealthCheck.checkApiHealth")(
      (url: string) => Effect.gen(function* () { /* impl */ })
    ),
  });
}

// Standalone layer export - ALWAYS add this
export const HealthCheckServiceLayer = HealthCheckService.layer;
```

**Usage in tests and application code:**

```typescript
import { HealthCheckService, HealthCheckServiceLayer } from "@map-poster/services";

// In application - provide the layer
const program = Effect.gen(function* () {
  const svc = yield* HealthCheckService;
  return yield* svc.checkApiHealth("http://api");
}).pipe(Effect.provide(HealthCheckServiceLayer));

// In tests - same pattern
it.effect("checks health", () =>
  Effect.gen(function* () {
    const svc = yield* HealthCheckService;
    const result = yield* svc.checkApiHealth("http://api");
    expect(result.success).toBe(true);
  }).pipe(Effect.provide(HealthCheckServiceLayer))
);
```

**Naming convention:**

- Service class: `{Name}Service` (e.g., `HealthCheckService`)
- Layer export: `{Name}ServiceLayer` (e.g., `HealthCheckServiceLayer`)

### Domain Services with Database

For services that need database access (slug generation, validation, etc.), inject Database via Layer:

```typescript
import { Context, Effect, Layer, Schema } from "effect";
import { Database } from "@map-poster/services";

// Error with Schema.TaggedError (preferred over Data.TaggedError)
export class EmptySlugError extends Schema.TaggedError<EmptySlugError>()(
  "EmptySlugError",
  {
    entityType: Schema.String,
    message: Schema.String,
  }
) {}

// Service interface
export class SlugService extends Context.Tag("@map-poster/SlugService")<
  SlugService,
  {
    readonly generateSlug: (
      name: string,
      excludeId?: string
    ) => Effect.Effect<string, EmptySlugError>;
  }
>() {}

// Layer with Database dependency
export const SlugServiceLayer = Layer.effect(
  SlugService,
  Effect.gen(function* () {
    const db = yield* Database;  // Inject database

    // Use Effect.fn for tracing
    const generateSlug = Effect.fn("SlugService.generateSlug")(
      function* (name: string, excludeId?: string) {
        const baseSlug = slugify(name);
        if (!baseSlug) {
          return yield* new EmptySlugError({
            entityType: "Entity",
            message: "Name must contain alphanumeric characters",
          });
        }

        // Use db from closure
        const exists = yield* Effect.promise(() =>
          db.query.table.findFirst({ where: eq(table.slug, baseSlug) })
        );

        return exists ? `${baseSlug}-2` : baseSlug;
      }
    );

    return { generateSlug };
  })
);
```

**Usage in TRPC with ManagedRuntime:**

```typescript
import { runtime } from "@/infrastructure/effect-runtime";

const slug = await runtime.runPromise(
  Effect.gen(function* () {
    const slugService = yield* SlugService;
    return yield* slugService.generateSlug(name);
  }).pipe(
    Effect.catchTag("EmptySlugError", (e) =>
      Effect.fail(badRequestError(e.message))
    )
  )
);
```

**Key points:**
- Database injected via `yield* Database` in Layer (not passed as parameter)
- Use `Schema.TaggedError` for errors (better Schema interop than `Data.TaggedError`)
- Use `Effect.fn` for automatic tracing
- Error handling with `catchTag` at TRPC boundary

## Option and Either Handling

**Never directly access `_tag` property.** Use Effect's functional utilities instead.

### Anti-Pattern: Direct \_tag Access

```typescript
// ❌ BAD - Direct _tag access
if (result._tag === "Some") {
  return result.value;
}

if (either._tag === "Left") {
  console.log(either.left);
}
```

### Correct Patterns

**Option:**

```typescript
import { Option } from "effect";

// Get value or default
Option.getOrElse(option, () => defaultValue);

// Pattern match
Option.match(option, {
  onNone: () => "nothing",
  onSome: (value) => `got ${value}`,
});

// Check and map
Option.isSome(option);
Option.isNone(option);
Option.map(option, (v) => transform(v));
Option.flatMap(option, (v) => anotherOption(v));
```

**Either:**

```typescript
import { Either } from "effect";

// Pattern match
Either.match(either, {
  onLeft: (error) => handleError(error),
  onRight: (value) => handleSuccess(value),
});

// Check type
Either.isLeft(either);
Either.isRight(either);

// Get value or handle error
Either.getOrElse(either, (error) => fallback);
Either.map(either, (v) => transform(v));
Either.mapLeft(either, (e) => transformError(e));
```

**In Tests (with Effect.either):**

```typescript
it.effect("handles error case", () =>
  Effect.gen(function* () {
    const result = yield* myEffect.pipe(Effect.either);

    Either.match(result, {
      onLeft: (error) => {
        expect(error._tag).toBe("MyError");
        expect(error.message).toContain("expected");
      },
      onRight: () => {
        expect.fail("Expected Left but got Right");
      },
    });
  })
);
```

## Workflow

1. Run `effect-solutions show <topic>` for relevant topics
2. Review code against current best practices
3. Provide specific recommendations with code examples
4. Use `btca` to search Effect source code for complex patterns when needed

## Why vi.mock() is an Anti-Pattern - Use Layers Instead

> Source: [Effect and the Near Inexpressible Majesty of Layers](https://www.effect.website/blog/layers)

**vi.mock() problems:**
- Misspelled file/function names → silent failures
- Wrong return types → no type checking
- Hidden dependencies → signature reveals nothing

**Effect solution: Context.Tag + Layer**

```typescript
// 1. Define service interface
class FeatureFlags extends Context.Tag("FeatureFlags")<FeatureFlags, {
  readonly isEnabled: (flag: string) => Effect.Effect<boolean>
}>() {}

// 2. Test layer - parameterized
const testFlagsLayer = (...enabled: string[]) =>
  Layer.succeed(FeatureFlags, {
    isEnabled: (flag) => Effect.succeed(enabled.includes(flag))
  })

// 3. Service that depends on FeatureFlags
const pricingLayer = Layer.effect(Pricing, Effect.gen(function* () {
  const flags = yield* FeatureFlags  // Dependency tracked in type!
  return {
    getPrice: Effect.fn(function* (base: number) {
      return (yield* flags.isEnabled("surge")) ? base * 6.5 : base
    })
  }
}))
// Type: Layer.Layer<Pricing, never, FeatureFlags>
//                                   ^^^^^^^^^^^^^^ requirement visible!

// 4. Test without mocks
it.effect("applies surge pricing", () =>
  Effect.gen(function* () {
    const pricing = yield* Pricing
    expect(yield* pricing.getPrice(100)).toBe(650)
  }).pipe(
    Effect.provide(pricingLayer),
    Effect.provide(testFlagsLayer("surge"))
  )
)
```

**Benefits:**
- Type-safe: misspellings = compile errors
- Explicit dependencies in types
- Composable test layers
- No import hoisting magic

### ManagedRuntime for Framework Integration

When integrating Effect with external frameworks (TRPC, Express, Fastify, etc.), use `ManagedRuntime` instead of inline `Effect.runPromise` with `Effect.provide()`.

**Problem with inline pattern:**

```typescript
// Bad - Creates layer per request, no shared runtime
const result = await Effect.runPromise(
  Effect.gen(function* () {
    const service = yield* MyService;
    return yield* service.doSomething(input);
  }).pipe(Effect.provide(MyServiceLive))
);
```

**Issues:**
1. Creates layers per-request (inefficient)
2. No shared fiber runtime
3. Verbose and repetitive

**Solution - ManagedRuntime:**

```typescript
// apps/web-app/src/infrastructure/effect-runtime.ts
import { ManagedRuntime, Layer } from "effect";
import { FetchHttpClient } from "@effect/platform";
import { MyService, OtherService } from "@map-poster/services";

// Compose all service layers once
const AppLayer = Layer.mergeAll(
  MyService.layer.pipe(Layer.provide(FetchHttpClient.layer)),
  OtherService.layer
);

// Create managed runtime (singleton)
export const runtime = ManagedRuntime.make(AppLayer);

// Type helper for runtime context
export type AppContext = ManagedRuntime.ManagedRuntime.Context<typeof runtime>;

// Graceful shutdown
export const disposeRuntime = async () => {
  await runtime.dispose();
};
```

**Usage in TRPC/HTTP handlers:**

```typescript
// Good - Uses shared runtime
import { runtime } from "@/infrastructure/effect-runtime";

export const router = {
  myEndpoint: protectedProcedure.query(async ({ input }) => {
    return runtime.runPromise(
      Effect.gen(function* () {
        const service = yield* MyService;
        return yield* service.doSomething(input);
      })
    );
  }),
};
```

**Benefits:**
- Single runtime created once at app startup
- Layers resolved once, reused across requests
- Better tracing with Effect.fn
- Testability - easy to swap layers

### Effect.fn Concise Syntax

When defining service methods, use the **concise `Effect.fn` syntax** with generator function directly:

```typescript
// Recommended - concise syntax
const checkForUpdates = Effect.fn("ServiceName.checkForUpdates")(
  function* (params: Params) {
    // Body directly here - no Effect.gen wrapper needed
    const result = yield* someEffect;
    return result;
  }
);

// Not recommended - verbose syntax
const checkForUpdates = Effect.fn("ServiceName.checkForUpdates")(
  (params: Params) =>
    Effect.gen(function* () {
      const result = yield* someEffect;
      return result;
    })
);
```

**Why concise syntax?**
- Less boilerplate (no `Effect.gen(function* () { ... })` wrapper)
- Same functionality
- Effect.fn automatically provides span tracing with the given name

**When verbose syntax is needed:**
- When you need to add operators after Effect.gen (`.pipe(...)`)
- Complex compositions that don't fit generator pattern

```typescript
// Verbose needed - when piping after Effect.gen
const withRetry = Effect.fn("Service.withRetry")(
  (params: Params) =>
    Effect.gen(function* () {
      // ...
    }).pipe(
      Effect.retry(retryPolicy),
      Effect.timeout("10 seconds")
    )
);
```

### Yieldable Errors

Use `yield* new ErrorClass(...)` instead of `yield* Effect.fail(ErrorClass.make(...))`:

```typescript
import { Schema } from "effect";

// Define tagged error
export class NotFoundError extends Schema.TaggedError<NotFoundError>()(
  "NotFoundError",
  {
    message: Schema.String,
    resourceType: Schema.String,
  }
) {}

// Recommended - yieldable syntax
const findUser = Effect.fn("User.find")(function* (id: string) {
  const user = yield* Effect.promise(() => db.findUser(id));
  
  if (!user) {
    return yield* new NotFoundError({
      message: "User not found",
      resourceType: "user",
    });
  }
  
  return user;
});

// Not recommended - verbose syntax
if (!user) {
  return yield* Effect.fail(
    NotFoundError.make({
      message: "User not found",
      resourceType: "user",
    })
  );
}
```

**Why yieldable errors?**
- Less boilerplate
- Schema.TaggedError classes are already yieldable
- More natural reading: "yield new error" vs "yield fail make error"
