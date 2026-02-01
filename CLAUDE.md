# Development Guidelines for map-poster

## 🎯 Core Principles

### KISS (Keep It Simple, Stupid)

- **Remove, don't preserve**: Delete old code completely instead of keeping it "just in case"
- **No backward compatibility**: Unless explicitly requested, implement new systems cleanly
- **Clean refactoring**: Remove the old system entirely rather than supporting both
- **No broken code**: Delete problematic imports and components immediately
- **Don't reinvent the wheel**: Always use existing patterns and conventions from the codebase instead of creating new ones

### DDD (Domain-Driven Design)

- Follow Domain-Driven Design principles

## 🎓 Skills System

**CRITICAL: Always LOAD the relevant skill BEFORE implementing domain-specific tasks.**

Skills contain detailed patterns, examples, and project-specific conventions. This file provides quick rules only.

| When working on...                              | LOAD skill first             |
| ----------------------------------------------- | ---------------------------- |
| Database tables, queries, migrations, relations | `drizzle-database`           |
| TRPC routers, procedures, middleware, errors    | `trpc-patterns`              |
| Routes, loaders, prefetching, forms, queries    | `tanstack-frontend`          |
| Authentication, sessions, protected procedures  | `better-auth`                |
| Sentry SDK, error tracking, tracing spans       | `sentry-integration`         |
| Production/test issues, performance debugging   | `production-troubleshooting` |
| Unit tests, TRPC integration, E2E tests         | `testing-patterns`           |
| Effect services, layers, error handling         | `effect-expert`              |
| N+1 fixes, batch operations, query optimization | `performance-optimization`   |
| UI components, styling, layouts                 | `frontend-design`            |
| Marketing copy, landing pages                   | `marketing-expert`           |
| Azure DevOps, pipeline debugging                | `azure-devops-debugging`     |
| Something doesn't work, need to debug library   | `debugging-with-opensrc`     |

### Autonomous Analysis

- **Deep investigation first**: Before asking questions, thoroughly investigate the codebase to understand context, patterns, and existing implementations
- **Minimize questions**: Only ask when information cannot be found in the codebase or documentation
- **Self-discovery**: Use available tools to find answers: MCP tools (CK semantic search, Exa search, Postgres, Sentry) and CLI tools (git, az, gh, opensrc) - see "Available Tools" section
- **Pattern recognition**: Identify existing patterns in the codebase and follow them consistently
- **Show findings**: When presenting analysis, show what you discovered and your reasoning

### Code Quality

- **Always validate**: Run `bun run check` from project root after every change
- **Documentation in English**: All markdown files must be written in English
- **Edit over create**: Always prefer editing existing files
- **Parallel execution**: When working on multiple independent tasks (e.g., fixing multiple files with similar changes), ALWAYS use parallel agents via the Task tool instead of doing them sequentially. This significantly improves efficiency.
- **Environment variables**: Always sort env variables and settings keys alphabetically
- **Environment infrastructure**: All env variables must be added to:
  1. App-specific `.env.example` and `.env` files with default `xxx` values
  2. `docker-compose.yml` and `docker-compose.prod.yml` when applicable
  3. Coolify environment configuration (production)
  4. CI/CD pipeline configuration (if applicable)

### Docker Compose Deployment

**Local Development:**

```bash
docker compose up -d      # Start all services
docker compose logs -f    # View logs
docker compose down       # Stop all services
```

**Production (Coolify):**

- Managed via Coolify dashboard at `clf.gaboe.xyz`
- Uses `docker-compose.prod.yml`
- Environment variables configured in Coolify UI
- more info avaulable at ~/op/coolify

- **File naming**: All filenames must use kebab-case (e.g., `contact-form.tsx`, `hero-section.tsx`)
- **Explicit parameters**: Always require parameters explicitly in constructors and functions - it's better than guessing how someone will use it in the future
- **No AI attribution**: NEVER include AI/Claude attribution in any output:
  - No "Co-Authored-By" in commits
  - No "Generated with Claude Code" in PRs
  - No "🤖" emoji signatures
  - No mentions of being AI-generated
- **Git workflow**: Never commit or push without explicit user permission - always wait for user approval
- **Sentry issue references**: NEVER use `Fixes ISSUE-ID` or `Closes ISSUE-ID` in commit messages on feature branches - Sentry auto-resolves issues immediately when it sees these keywords, even without deployment! Use `Addresses ISSUE-ID` or `Related to ISSUE-ID` instead. Only use `Fixes` when committing directly to prod branch.
- **E2E testing**: After major changes, run `bun run test:e2e` to ensure nothing is broken

## 📁 Project Overview

### Versioned Files

The following files/directories are intentionally **tracked in git** (not ignored):

- **`.sisyphus/plans/`** - Agent planning documents should be versioned for collaboration and history

### Product

**Map Poster** is a web tool that generates personalized map posters from any location worldwide. Users enter a location, select a visual theme (17 available), and receive custom map artwork in seconds.

**Target Audience:** Gift givers, home decorators, travelers commemorating memories.

**Language:** Czech (UI and copy)

### Documentation

The `docs/` folder contains important project documentation that should be respected:

| Document               | Description                                                                 |
| ---------------------- | --------------------------------------------------------------------------- |
| `docs/sales.md`        | Marketing strategy, positioning, messaging guidelines, and sales objections |
| `docs/design.md`       | Design system, color palette, typography, components, and design decisions  |
| `docs/architecture.md` | Technical architecture overview                                             |

**When working on:**

- **Marketing copy, landing page, CTAs** → Read `docs/sales.md` first
- **UI components, colors, fonts, styling** → Read `docs/design.md` first
- **System design, infrastructure** → Read `docs/architecture.md` first

### Architecture

This is a full-stack monorepo built with:

- **TanStack Start**: React-based SSR framework with built-in server
- **TRPC Server**: Type-safe API embedded in TanStack Start server
- **Better Auth**: Authentication and authorization
- **PostgreSQL + Drizzle ORM**: Type-safe database access
- **Effect**: Business logic and functional programming patterns
- **Docker Compose + Coolify**: Production deployment
- **Python FastAPI** (`apps/api`): Map poster generation service

### Map Poster API (`apps/api`)

Python FastAPI service for generating map posters from OpenStreetMap data.

**Stack:** Python 3.12, FastAPI, osmnx, geopandas, matplotlib

**Architecture:**

```
POST /api/generate → Job Queue → ThreadPool (2 workers) → Poster Service → PNG
                                        ↓
                              OSMnx (Overpass API) ← main bottleneck
```

**Key Files:**

- `app/main.py` - FastAPI entry point, health/themes endpoints
- `app/routes/generate.py` - Generate endpoint with rate limiting (10/min)
- `app/job_queue.py` - Async job queue with ThreadPoolExecutor
- `app/poster_service.py` - Core rendering logic (OSM fetch + matplotlib)
- `themes/` - 17 JSON theme definitions

**Bottlenecks:**

1. **Overpass API** - 3 HTTP calls per poster (streets, water, parks) + rate limiting delays
2. **CPU rendering** - matplotlib projections take 5-30s depending on complexity
3. **Serial processing** - Only 2 ThreadPoolExecutor workers

**Local Development:**

```bash
cd apps/api
uv sync                                      # Install dependencies
uv run uvicorn app.main:app --reload --port 8000  # Run server
uv run pytest                                # Run tests
```

**Caching:** File-based pickle cache in `cache/` directory. Clear with `rm -rf cache/*`.

### Tech Stack

- **Frontend**: React 19 with TanStack ecosystem (Start, Router, Query, Form, Table)
- **Backend**: TRPC embedded in TanStack Start server
- **Auth**: Better Auth with Stripe integration
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Effect Schema (Zod only for env validation via `@t3-oss/env-core`)
- **Package Manager**: Bun
- **Runtime**: Bun (development and production)

## 🛠️ Development Guidelines

### 1. TypeScript & JavaScript Best Practices

#### Import Rules

**Always use absolute imports:**

```typescript
// ✅ Good
import { logger } from "@map-poster/logger";
import { Button } from "@/components/ui/button";

// ❌ Bad
import { logger } from "../../../packages/logger";
import { Button } from "../../components/ui/button";
```

- `@map-poster/*` - Packages (common, db, logger, services)
- `@/` - Application code (apps/web-app)

#### No Barrel Files

Avoid creating `index.ts` files that only re-export from other files (barrel files). They cause:

- **Circular imports** - Hard to debug runtime errors
- **Slower dev server** - Imports load all re-exported modules
- **Hidden dependencies** - Makes code harder to trace

```typescript
// ❌ Bad - Barrel file (index.ts)
export { TabList } from "./tab-list";
export { TabPanel } from "./tab-panel";
export { useTabState } from "./use-tab-state";

// ❌ Bad - Importing from barrel
import { useTabState } from "@/components/tabs";

// ✅ Good - Direct imports
import { useTabState } from "@/components/tabs/use-tab-state";
import { TabList } from "@/components/tabs/tab-list";
```

**Exceptions (barrel files are OK):**

- Package entry points (`packages/*/src/index.ts`) - Required for package exports
- Route `index.tsx` files - TanStack Router convention
- Files with actual logic (not just re-exports)

#### Nullish Coalescing Operator

Always use `??` (nullish coalescing) instead of `||` (logical OR) for default values:

```typescript
// ✅ Good - Only uses default for null/undefined
const value = process.env.API_KEY ?? "default";
const port = config.port ?? 3000;

// ❌ Bad - Also uses default for "", 0, false
const value = process.env.API_KEY || "default";
const port = config.port || 3000;
```

**Why?** `??` only checks for `null` or `undefined`, while `||` treats `""`, `0`, and `false` as falsy.

#### Bun APIs

Always use Bun's native APIs instead of Node.js polyfills for better performance.

```typescript
// ✅ Good - Bun native APIs
const text = await Bun.file(filePath).text();
const json = await Bun.file(filePath).json();
await Bun.write(filePath, content);

// Process spawning
const proc = Bun.spawn(["git", "clone", url], {
  stdout: "pipe",
  stderr: "pipe",
});
const exitCode = await proc.exited;
const stderr = await new Response(proc.stderr).text();

// Directory operations
const mkdirProc = Bun.spawn(["mkdir", "-p", dirPath]);
await mkdirProc.exited;

// Path operations - use template literals
const configPath = `${process.cwd()}/config.json`;

// ❌ Bad - Node.js polyfills (DON'T USE)
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";
```

**Bun API Reference**: https://bun.com/docs/runtime/bun-apis

**Bun Local Docs**: For detailed API information, read the Bun docs in `node_modules/bun-types/docs/**.mdx`.

**When to use Bun vs Node.js:**

- ✅ **Use Bun**: File I/O, process spawning, directory operations, simple path joins
- ✅ **Use Node.js**: Complex path operations (`resolve`, `dirname`)

### 2. Effect Schema Configuration

This project uses **Effect Schema** for validation in TRPC routers and domain models.

```typescript
import { Schema } from "effect";

// For TRPC input validation, wrap with Schema.standardSchemaV1()
.input(
  Schema.standardSchemaV1(
    Schema.Struct({
      organizationId: OrganizationId,  // Branded type from @map-poster/common
      name: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Name is required" })
      ),
    })
  )
)
```

**Key patterns:**

- `Schema.Struct({...})` - Object schemas
- `Schema.String`, `Schema.Number`, `Schema.Boolean` - Primitives
- `Schema.Literal("a", "b", "c")` - Enums/unions
- `Schema.Array(Schema.String)` - Arrays
- `Schema.optional(Schema.String)` - Optional fields
- `Schema.String.pipe(Schema.brand("UserId"))` - Branded types

**Note:** Zod is ONLY used for environment variable validation (required by `@t3-oss/env-core`).

### 3. Frontend Patterns

> **CRITICAL:** Before creating routes, loaders, or working with TRPC queries → LOAD skill `tanstack-frontend` first.

**Quick rules (load skill for full patterns):**

- **Routes**: Use `createFileRoute()` with loader for SSR prefetching. Route names are based on folder structure.
- **Queries**: Use `useSuspenseQuery(trpc.X.queryOptions())`, NEVER `.useQuery()` directly
- **Mutations**: Use `useMutation(trpc.X.mutationOptions({ onSuccess, onError }))`
- **Cache**: Invalidate with `queryClient.invalidateQueries({ queryKey: trpc.routerName.queryKey() })`
- **Forms**: Use `useAppForm` from `@/shared/forms/form-context`, not raw TanStack Form
- **Props**: Always name type as `Props`, not component-specific names like `DeleteModalProps`
- **Types**: Use `RouterInputs`/`RouterOutputs` from TRPC, never create manual types
- **Prefetch**: Use `await` for critical data, `void` for secondary data, `Promise.all` for parallel

### 4. Database Schema Best Practices

> **CRITICAL:** Before creating tables, writing queries, or modifying schema → LOAD skill `drizzle-database` first.

**Quick rules (load skill for full patterns):**

- **Branded IDs**: Always use `.$type<UserId>()` for type-safety
- **Single queries**: Prefer JOINs over multiple queries (N+1 prevention)
- **Relations**: INNER JOIN for required, LEFT JOIN for optional
- **Schema location**: `packages/db/src/schema.ts`
- **Types**: Define in `@map-poster/common`, use discriminated unions

### 5. TRPC Router Patterns

> **CRITICAL:** Before creating/modifying TRPC routers → LOAD skill `trpc-patterns` first.

**Quick rules (load skill for full patterns):**

- **Schema**: Use `Schema.standardSchemaV1()` from Effect, wrap all inputs
- **Procedures**: Use custom procedures (`protectedOrganizationMemberProcedure`) instead of manual checks
- **Errors**: Use helpers from `@/infrastructure/errors.ts` (`notFoundError`, `forbiddenError`, etc.)
- **Types**: Import from `@map-poster/common`, never hardcode enum values

**Available Procedures** (defined in `apps/web-app/src/infrastructure/trpc/procedures/`):

| Procedure                              | Description                                |
| -------------------------------------- | ------------------------------------------ |
| `publicProcedure`                      | No authentication required                 |
| `protectedProcedure`                   | Requires authenticated user                |
| `adminProcedure`                       | Requires admin role                        |
| `protectedOrganizationMemberProcedure` | Requires organization membership           |
| `protectedOrganizationAdminProcedure`  | Requires org admin/owner role              |
| `protectedProjectMemberProcedure`      | Requires project access via org membership |
| `protectedProjectAdminProcedure`       | Requires project admin permissions         |
| `protectedProjectEditorProcedure`      | Requires editor+ permissions               |

### 6. Code Refactoring Guidelines

#### Proactive Duplicate Code Detection

When working with multiple components, actively look for code duplication patterns:

```typescript
// ✅ Good - Component props naming
type Props = {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onConfirm: () => void;
  isDeleting?: boolean;
};

export function DeleteMemberModal({
  isOpen,
  onClose,
  userName,
  onConfirm,
  isDeleting = false,
}: Props) {
  // Component implementation
}

// ❌ Bad - Component-specific props naming
type DeleteMemberModalProps = {
  isOpen: boolean;
  // ... other props
};
```

**Rule**: If you encounter substantial duplicate code across 2+ components during development, proactively ask the user: _"I notice duplicate code between [ComponentA] and [ComponentB]. Would you like me to refactor this into a shared component for better maintainability?"_

### 7. Code Style Preferences

#### Functions Over Classes

```typescript
// ✅ Good - Simple function
export async function getProviderConfig(
  organizationId: string,
  provider: ProviderType,
): Promise<Config | null> {
  // Implementation
}

// ❌ Bad - Unnecessary class
export class DatabaseConfigProvider {
  async getProviderConfig(/* params */) {
    // Same implementation
  }
}
```

#### When to Use Classes

- Managing state across multiple method calls
- Implementing interfaces or extending functionality
- Creating instances with encapsulated data

### 8. Logging

#### Backend Logging (TRPC routers, server-side code)

Use `@map-poster/logger` (Pino-based structured logging) for all backend/server-side code:

```typescript
import { logger } from "@map-poster/logger";

// ✅ Good - Structured logging with context object first, message second
logger.info(
  {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiresIn: tokens.expires_in,
    scope: tokens.scope,
  },
  "Microsoft OAuth received tokens",
);

logger.error(
  {
    integration,
    sessionId,
    error: error instanceof Error ? error.message : String(error),
  },
  "[OAUTH_HANDLER] Error refreshing token",
);

// For simple messages without context
logger.info("map-poster OpenAPI ready at http://localhost:3000");

// ❌ Bad - Using console.log/console.error in backend code
console.log("Microsoft OAuth received tokens");
console.error("Error refreshing token:", error);
```

**Backend Logger Pattern:**

- **Import**: Always use `import { logger } from "@map-poster/logger"`
- **First parameter**: Context object with structured data (optional)
- **Second parameter**: Human-readable message string
- **Available methods**: `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()`
- **Do NOT create child logger**: Just use the global `logger` directly

#### Frontend Logging (React components, hooks, client-side code)

Use `console.log`/`console.error` for frontend/client-side code. The `@map-poster/logger` package is server-only and cannot be used in browser code:

```typescript
// ✅ Good - Console logging in React components
onError: (error) => {
  console.error("Waitlist submission error:", error);
  setSubmitStatus("error");
},

// ❌ Bad - Using @map-poster/logger in frontend code (will not work)
import { logger } from "@map-poster/logger"; // This is server-only!
```

#### Application Logs

Application logs are stored in `apps/web-app/logs` directory. Use these logs for debugging runtime issues, errors, and application behavior.

<!-- effect-solutions:start -->

### 9. Effect Best Practices

**Before implementing Effect features**, run `effect-solutions list` and read the relevant guide.

Available topics:

- `effect-solutions show basics` - Coding conventions for Effect.fn and Effect.gen
- `effect-solutions show services-and-layers` - Context.Tag and Layer patterns for dependency injection
- `effect-solutions show data-modeling` - Records, variants, brands, pattern matching, and JSON serialization
- `effect-solutions show error-handling` - Schema.TaggedError modeling, pattern matching, and defects
- `effect-solutions show config` - Effect Config usage, providers, and layer patterns
- `effect-solutions show testing` - How to test Effect code with @effect/vitest

**Effect Reference:** Use `opensrc` to read Effect source code. Effect docs are also available via WebFetch at `https://effect.website/llms.txt`.

**Effect LLM Docs:** Effect supports the llms.txt convention for LLM-friendly documentation. Use WebFetch to retrieve:

- `https://effect.website/llms.txt` - listing of available documentation files

<!-- effect-solutions:end -->

## 🔧 Available Tools

<!-- opensrc:start -->

### OpenSrc - External Source Code

**CRITICAL: Never guess how a library works. Always verify by reading the actual source code.**

OpenSrc provides access to the exact version of external libraries installed in this project. This is essential because:

- **Documentation can be outdated or incomplete** - source code is the truth
- **API behavior changes between versions** - you have the exact version we use
- **Implementation details matter** - understanding internals prevents bugs
- **No hallucinations** - you see exactly what the code does, not what you assume

**When to use opensrc (USE FREQUENTLY):**

- Before implementing patterns with Effect, TRPC, TanStack, Drizzle, Better Auth
- When something doesn't work as expected - read the actual implementation
- When documentation is unclear or missing - source code has the answers
- Before making assumptions about library behavior - verify first
- When debugging integration issues - understand what the library actually does

**Commands:**

```bash
bun run opensrc:sync              # Sync all repos from sources.json (run after clone)
bun run opensrc:use <package>     # Fetch new package (e.g., zod, effect)
bun run opensrc:use owner/repo    # Fetch GitHub repo (e.g., trpc/trpc)
```

**Reading source code:**

```
opensrc/repos/github.com/<owner>/<repo>/
```

**Configuration files** (tracked in git):

- `opensrc/sources.json` - List of synced repositories and packages
- `opensrc/settings.json` - Settings (allowFileModifications: false)

**Source code** (git-ignored):

- `opensrc/repos/` - Cloned repositories

**Available sources** (see `opensrc/sources.json` for full list):

- Effect, TanStack Router/Query/Start, TRPC, Drizzle ORM
- Better Auth, Base UI, Tailwind docs, shadcn/ui
- Sentry, Pino, Trigger.dev, and more

**Example - When to use opensrc:**

```
User: "TanStack Form validation isn't working with Effect Schema"

BAD approach (guessing/web search):
1. Search Exa for "TanStack Form validation issue"
2. Find random blog posts or outdated GitHub issues
3. Try solutions that may not apply to our exact version
4. Waste time debugging based on assumptions

GOOD approach (opensrc first):
1. Read opensrc/repos/github.com/TanStack/router/packages/react-form/src/
2. Find the actual validator implementation
3. Check how Standard Schema integration works in OUR version
4. Understand the exact expected return type { fields: {...} }
5. Fix based on actual implementation, not assumptions
```

<!-- opensrc:end -->

### MCP Tools

| Tool                            | Description                                                                                                                                     | When to use                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **CK** (`@beaconbay/ck-search`) | Semantic code search - finds code by meaning using AI embeddings + tree-sitter AST. Supports `semantic_search`, `regex_search`, `hybrid_search` | Finding code by intent, not exact keywords. E.g. "error handling" finds try/catch blocks      |
| **Context7**                    | Library documentation fetching                                                                                                                  | Get up-to-date docs for npm packages, frameworks. First resolve library name, then fetch docs |
| **Exa**                         | AI-powered web search                                                                                                                           | Research external APIs, examples, troubleshooting, best practices                             |
| **Sentry**                      | Error tracking integration                                                                                                                      | Investigating production errors, stack traces                                                 |
| **Chrome DevTools**             | Browser automation                                                                                                                              | UI testing, screenshots, console inspection                                                   |
| **Postgres** (`postgres-mcp`)   | PostgreSQL database access                                                                                                                      | Direct DB queries, data inspection, debugging data issues                                     |

### CLI Tools

| Tool          | Description                   | Common commands                                                             |
| ------------- | ----------------------------- | --------------------------------------------------------------------------- |
| **opensrc**   | Fetch npm package source code | `bun run opensrc:sync` (after clone), `bun run opensrc:use <pkg>` (new pkg) |
| **az**        | Azure CLI                     | `az devops`, `az repos`, `az pipelines`, `az aks`                           |
| **db-tool**   | Database queries              | `bun run tools/db-tool.ts --help` - see usage and schema introspection      |
| **gh**        | GitHub CLI                    | `gh pr`, `gh issue`, `gh repo`, `gh api`                                    |
| **git**       | Version control               | `git status`, `git diff`, `git log`, `git blame`                            |
| **logs-tool** | Application logs              | `bun run tools/logs-tool.ts --help` - read logs from local/test/prod        |

### Tool Priority

1. **CLI Tools (Preferred)** - More efficient, don't load context, provide full functionality
2. **MCP Tools (Fallback)** - Use when CLI alternatives don't exist

### UI Testing with Chrome MCP

**Chrome MCP Server** is available for automated browser testing and interaction. Use it to verify UI changes immediately after implementation.

#### Test Credentials

- **URL**: http://localhost:3000/sign-in
- **Test Account Email**: claude.code@map-poster.cz
- **Test Account Password**: TestPass123

#### Testing Workflow

**After making UI changes, test them using Chrome MCP:**

**Proactive Testing (no user confirmation needed):**

- Read-only UI changes (viewing, rendering, displaying data)
- Visual changes (styling, layout, component structure)
- Navigation and routing changes
- Form validation display (error messages, validation states)

**Ask User First (requires confirmation):**

- Operations that modify data (create, update, delete)
- Form submissions that write to database
- Payment or billing operations
- User account modifications
- Any operation that could corrupt or affect production/test data

**Testing Steps:**

1. Navigate to the relevant page
2. Take a snapshot to verify elements are present
3. Interact with the UI (for read-only operations) or ask user permission (for write operations)
4. Check console for errors
5. Verify expected behavior and outcomes

#### Example Testing Scenarios

**Proactive (automatic):**

```typescript
// View page rendering - test automatically
1. Navigate to /app/organization/members
2. Take snapshot to verify members table renders
3. Check console for errors
4. Verify data displays correctly

// Form validation - test automatically
1. Navigate to form page
2. Fill invalid data
3. Try to submit (without actually submitting)
4. Verify error messages appear
```

**Ask First (requires permission):**

```typescript
// Delete operation - ASK user first
1. Navigate to member management
2. Click delete button
3. ⚠️  ASK: "Can I test the member deletion? This will delete test data."
4. If approved: Complete deletion flow
5. Verify success message and data removal

// Create operation - ASK user first
1. Navigate to create form
2. Fill form fields
3. ⚠️  ASK: "Can I test form submission? This will create test data in database."
4. If approved: Submit form
5. Verify creation and database record
```

### Database Access with db-tool

Use `db-tool.ts` for direct SQL access to local/test/prod databases.

```bash
# Always start with --help to see usage and schema introspection workflow
bun run tools/db-tool.ts --help
```

**IMPORTANT:** Never guess table/column names - always introspect schema first using `--schema tables` and `--schema columns --table <name>`!

### Testing

> **Skill available:** Load skill `testing-patterns` for unit tests, TRPC integration tests, and E2E test patterns.

**Test hierarchy (prefer simpler):**

1. **Unit tests** (preferred) - Pure functions, parsers, Effect services with mock layers
2. **TRPC Integration** (ask first) - Full TRPC stack with PGlite in-memory database
3. **E2E** (ask + justify) - Playwright browser automation, most expensive to maintain

**Commands:**

```bash
bun run test              # Run all unit + TRPC integration tests
bun run test:watch        # Watch mode
bun run test:coverage     # With coverage
bun run test:e2e          # Run E2E tests (Playwright)
```

**Test file locations:**

| Code Location            | Test Location                           |
| ------------------------ | --------------------------------------- |
| `packages/X/src/file.ts` | `packages/X/src/__tests__/file.test.ts` |
| TRPC routers             | `apps/web-app/src/__tests__/*.test.ts`  |
| Routes/UI                | `apps/web-app/e2e/*.e2e.ts`             |

**Decision process:** Always prefer unit tests. Ask user before writing TRPC integration or E2E tests.

## 📋 Quick Reference

### Validation Command

```bash
bun run check  # Always run from project root
```

### Development Server Auto-restart

The TanStack Start development server automatically restarts when changes are made to the codebase. No manual restart is needed.

**IMPORTANT**: Never start the development server yourself - wait for user permission first.

### Common Issues & Solutions

| Issue                         | Solution                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Schema type mismatch          | Check imports use `Schema` from `effect`, wrap with `Schema.standardSchemaV1()` |
| TRPC type errors              | Use `RouterInputs/RouterOutputs`                                                |
| Broken imports after refactor | Delete the file/component                                                       |
| Complex migration needed      | Drop and recreate database                                                      |
| TRPC cache invalidation       | Use `queryClient.invalidateQueries({ queryKey: trpc.routerName.queryKey() })`   |

### Key Database Tables

Defined in `packages/db/src/schema.ts`:

- `usersTable` - User accounts
- `sessionsTable` - Auth sessions
- `accountsTable` - OAuth accounts
- `organizationsTable` - Organization data
- `membersTable` - Organization members
- `invitationsTable` - Pending invitations
- `projectsTable` - Organization projects
- `projectMembersTable` - Project-level member access

### Project Paths

- **Root**: `./`
- **Web App**: `./apps/web-app/`
- **Packages**: `./packages/`

## 📝 Important Reminders

1. **Do exactly what's asked** - nothing more, nothing less
2. **Never create unnecessary files** - especially documentation
3. **All markdown must be in English**
4. **Run validation after every change**
5. **Delete old code completely** when refactoring
6. **Keep schemas inline** for simple TRPC routers
7. **Use strong typing** everywhere with TypeScript
8. **Proactive refactoring**: When encountering duplicate code across multiple components, ask if refactoring is desired for maintainability
9. **Regular comment cleanup**: Run `git diff` regularly and remove unnecessary comments, especially those related to recent work you did

## 🚫 What NOT to Do

- Don't keep old code for backward compatibility
- Don't create complex migration paths
- Don't use `interface` when `type` works

  ```typescript
  // ❌ Bad - unnecessary interface
  interface UserProps {
    name: string;
    email: string;
  }

  // ✅ Good - simple type alias
  type UserProps = {
    name: string;
    email: string;
  };
  ```

- Don't create separate schema files for simple validations
- Don't use classes for simple stateless functions
- Don't create types manually when TRPC can infer them - ALWAYS use `RouterInputs`/`RouterOutputs`
- Don't use component-specific props type names (use `Props` instead)
- Don't use relative imports - ALWAYS use absolute imports with `@/` or `@map-poster/*` (exception: test files in `__tests__/` can use relative imports for test utilities)
- Don't use dynamic imports for types - NEVER use `import("../path").Type` syntax, always use regular static imports
- Don't use default parameter values in function signatures - they hide dependencies and cause subtle bugs when callers forget to provide required values. Make parameters required and fix all call sites explicitly.

  ```typescript
  // ❌ Bad - default hides required dependency, caller forgets to pass it
  function createIssue(title: string, source: Source = "default") {}

  // ✅ Good - caller must explicitly provide source
  function createIssue(title: string, source: Source) {}
  ```

## 🔧 Production/Test Environment Troubleshooting

> **Skill available:** Load skill `production-troubleshooting` for detailed investigation workflow and helper scripts.

When user reports performance issues on test/production (not localhost):

### Investigation Steps

1. **Sentry MCP** - Check traces for slow queries and external API latency
2. **Coolify logs** - Review service logs for web-app/api (`[Server]`, `[SSR]`, `[tRPC]`, `[DB Pool]`)
3. **Server metrics** - Check CPU/memory usage in Coolify (or `docker stats` locally)
4. **Configuration check** - Verify environment variables and container health in Coolify

### Common Causes

- CPU/Memory throttling (high utilization)
- Network latency (DNS, TCP to database)
- DB connection pool issues (`idleTimeoutMillis` config)
- Sequential external API calls (should be parallel)
