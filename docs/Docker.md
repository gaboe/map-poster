# Docker Build Patterns

## Current Setup

| Dockerfile                        | Pattern                           | Why                                      |
| --------------------------------- | --------------------------------- | ---------------------------------------- |
| `apps/web-app/Dockerfile`         | Direct install, reinstall in prod | Needs workspace symlinks for Vite build  |
| `jobs/pre-deployment/Dockerfile`  | Direct install in `/app`          | Needs workspace symlinks for drizzle-orm |
| `jobs/post-deployment/Dockerfile` | Direct install in `/app`          | Needs workspace symlinks for drizzle-orm |

## Design Decisions

### All Dockerfiles: Direct Install Pattern

We install dependencies directly in `/app` with `bun install --frozen-lockfile` instead of using Bun's recommended temp directory pattern.

**Reason:** Bun workspace symlinks don't survive the copy. Workspace package dependencies (like `drizzle-orm` in `packages/db`) are stored in `.bun/` but not symlinked properly when copying `node_modules/` between stages.

### web-app: Reinstall in Prod Stage

We run `bun install --frozen-lockfile` in prod stage instead of copying node_modules from base.

**Reason:** Docker COPY doesn't preserve workspace symlinks properly. Copying node_modules results in broken `@map-poster/*` package resolution. Fresh install creates correct symlinks.

**Important:** ALL workspace package.json files must be copied for lockfile validation (not just the ones needed at runtime).

## Known Issues & Failed Attempts

Reference for future optimization attempts:

| Attempt                                     | Result    | Issue                                                           |
| ------------------------------------------- | --------- | --------------------------------------------------------------- |
| Temp directory pattern for web-app          | ❌ Failed | "Script not found vite" - workspace deps not symlinked          |
| Temp directory pattern for jobs             | ❌ Failed | "Cannot find module drizzle-orm" - workspace deps not symlinked |
| `bunx --bun vite` instead of `bun vite`     | ❌ Failed | bunx downloads packages instead of using local                  |
| Creating `.bin` symlinks manually           | ❌ Failed | vite.config.ts imports also fail (plugins need symlinks too)    |
| `bun install --production` in prod stage    | ❌ Failed | Implicit `--frozen-lockfile` causes lockfile mismatch           |
| `bunfig.toml` with `frozenLockfile = false` | ❌ Failed | `--production` flag overrides config                            |
| Copy node_modules from base to prod         | ❌ Failed | Docker COPY breaks workspace symlinks, module resolution fails  |

## References

- [Bun Docker Guide](https://bun.sh/docs/guides/ecosystem/docker)
- [Bun --production frozen lockfile bug](https://github.com/oven-sh/bun/issues/10949)
