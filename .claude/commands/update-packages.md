---
description: Update npm packages to latest versions with intelligent breaking change handling
argument-hint: [package-filter or group-name]
---

# Update Packages

$ARGUMENTS

Autonomously update npm packages to their latest versions, handling breaking changes intelligently.

## Definition of Done

When State output shows:
1. `bun upgrade` → "Congrats! You're already on the latest version"
2. `bun run update:packages` → No packages to select

## If Bun Updates

1. Update `packageManager` in root AND `apps/web-app/package.json`
2. Find and update ALL Dockerfiles: `find . -name "Dockerfile" -type f`
3. Find and update ALL CI pipeline BUN_VERSION references:
   ```bash
   grep -rn "BUN_VERSION" --include="*.yml" --include="*.yaml" . | grep -v node_modules | grep -v opensrc
   ```
4. Run `bun install && bun run check && bun run test`
5. Commit: `chore(deps): update bun to vX.X.X`

## If Playwright Updates

**CRITICAL:** Playwright npm version MUST match Docker image version exactly!

1. Find ALL Playwright Docker image references:
   ```bash
   grep -r "mcr.microsoft.com/playwright" --include="Dockerfile" --include="*.yml" --include="*.yaml" .
   ```
2. Update ALL matches to: `mcr.microsoft.com/playwright:vX.X.X-noble`
   - `jobs/e2e-runner/Dockerfile` - E2E runner image
   - `azp/jobs/e2e-tests.yml` - Azure pipeline container
3. Run `bun run test:e2e` to verify
4. Commit: `chore(deps): update playwright to vX.X.X`

## Catalog Packages

Catalog packages in root `package.json` may not be detected by `bun run update:packages`. Check manually:

```bash
npm view effect version && npm view @effect/platform version && npm view better-auth version && npm view drizzle-orm version && npm view @trpc/server version && npm view pino version
```

## Package Groups (Update Together)

| Group | Packages |
|-------|----------|
| **tanstack-router** | @tanstack/react-router, @tanstack/react-router-devtools, @tanstack/react-start, @tanstack/zod-adapter |
| **tanstack-query** | @tanstack/react-query, @tanstack/react-query-devtools |
| **trpc** | @trpc/client, @trpc/server, @trpc/tanstack-react-query |
| **effect** | effect, @effect/platform, @effect/vitest, @effect/language-service |
| **drizzle** | drizzle-orm, drizzle-kit |
| **pino** | pino, pino-pretty, pino-roll |
| **playwright** | @playwright/test ⚠️ Requires Dockerfile update! |

## Update Strategy

**For packages shown in State:** Edit version directly in the correct `package.json`, then `bun install`.

**For catalog packages:** Edit version in root `package.json` under `catalog` or `catalogs` section, then `bun install`.

## Testing Requirements

| Update Type | Required Tests |
|-------------|----------------|
| All updates | `bun run check && bun run test` |
| TanStack, React, Sentry, better-auth, Base UI | + `bun run test:e2e` |

## Common Breaking Changes

| Package | Fix |
|---------|-----|
| **@effect/language-service 0.72.0+** | New lint rules - run `bun run check:effect` |
| **@types/react** | FormEvent deprecated → use SyntheticEvent |
| **@base-ui/react** | Check ref type compatibility |

## Guardrails

- **DO NOT** update `workspace:*` versions
- **DO NOT** use `bun outdated` (misses packages)
- **DO NOT SKIP** `@typescript/native-preview`

## State

!`echo "=== Bun ===" && bun upgrade && echo "" && echo "=== Checking all workspaces ===" && bun run update:packages && echo "" && echo "=== Docker/Container versions ===" && grep -rh "FROM.*bun\|FROM.*playwright\|container:.*playwright" --include="Dockerfile" --include="*.yml" --include="*.yaml" . 2>/dev/null | grep -v node_modules | sort -u && echo "" && echo "=== CI Pipeline BUN_VERSION ===" && grep -rn "BUN_VERSION=" --include="*.yml" --include="*.yaml" . 2>/dev/null | grep -v node_modules | grep -v opensrc | grep -v "CURRENT_BUN"`
