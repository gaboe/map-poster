# map-poster

A production-ready TypeScript monorepo with TanStack Start, TRPC, Better Auth, and PostgreSQL.

> Generated from [map-poster](https://github.com/blogic-cz/map-poster)

## Quick Start

**Prerequisites:** [Bun](https://bun.sh/) and Docker installed

### 1. Initialize and Start Development Server

```bash
./dev.sh
```

This automatically:

- Creates `.env` files from templates
- Starts PostgreSQL database
- Installs dependencies
- Runs database migrations
- Starts development server at `http://localhost:3000`

### 2. Common Commands

```bash
# Start development server (if already initialized)
bun run dev

# Check code quality (lint, typecheck, format)
bun run check

# View database UI
bun run db:studio

# Stop database
docker-compose down
```

## Testing

### Run unit tests

This template uses Bun's built-in test runner.

```bash
# Run all tests
bun test
```

Current test coverage focuses on the `packages/*` workspace (pure unit tests). The `apps/web-app` app currently has no unit tests by default.

### Run E2E smoke tests

E2E smoke tests use Playwright and expect a running web server (by default `http://localhost:3000`). Test files are named `*.e2e.ts` so they do not get picked up by `bun test`.

```bash
# Install browser once
bun run test:e2e:install

# In a separate terminal, start the app
bun run dev

# Run smoke tests
bun run test:e2e

# Interactive UI mode (select tests, watch, rerun)
bun run test:e2e:ui
```

### Run coverage

```bash
# Print coverage to console
bun test --coverage

# Generate LCOV file for CI tools
bun test --coverage --coverage-reporter=lcov

# Generate both text output and LCOV (recommended for CI)
bun test --coverage --coverage-reporter=text --coverage-reporter=lcov --coverage-dir=coverage
```

This generates:

- `coverage/lcov.info` (LCOV report file)

Note: Some “tag-only” Effect modules (e.g. `Context.Tag`, `Data.TaggedError`) don’t contain meaningful executable logic, and Bun’s function coverage can be misleading for them. Those files are excluded via `bunfig.toml` `coveragePathIgnorePatterns`.

## CI/CD Pipeline

This template includes a fully configured Azure DevOps pipeline with comprehensive testing and reporting.

### Pipeline Stages

```
CheckCodeQuality → Build → Pre-Deployment → Web App → Post-Deployment → Build E2E → E2E Tests
```

| Stage                  | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| **CheckCodeQuality**   | Lint, typecheck, format check, unit tests with coverage    |
| **Build**              | Docker images for web-app, pre-deployment, post-deployment |
| **Pre-Deployment**     | Database migrations                                        |
| **Web App Deployment** | Deploy to Coolify                                          |
| **Post-Deployment**    | Seed data, cleanup tasks                                   |
| **Build E2E Runner**   | Build Playwright Docker image                              |
| **E2E Tests**          | Run Playwright tests in CI containers                      |

### Test Reports in Azure DevOps

After each pipeline run, you'll find these reports in the build results:

| Tab               | Content                                       |
| ----------------- | --------------------------------------------- |
| **Tests**         | Unit test and E2E test results (JUnit format) |
| **Code Coverage** | Line-by-line coverage report from unit tests  |
| **Extensions**    | Playwright report summary with direct links   |
| **Artifacts**     | Downloadable Playwright HTML report           |

### Coverage Report

Unit test coverage is automatically published to Azure DevOps:

- View coverage in the **Code Coverage** tab
- Download detailed `lcov.info` from artifacts
- Coverage is generated using Bun's built-in coverage reporter

### E2E Test Report

Playwright E2E tests generate:

- **JUnit XML** - Displayed in Tests tab with pass/fail details
- **HTML Report** - Interactive report (download from Artifacts tab)
- **Traces** - Available for failed tests for debugging

### Notifications

To receive notifications when the pipeline fails:

1. Go to **Project Settings** → **Notifications**
2. Create a new subscription for **"Build completed"** with filter **"Build status = Failed"**
3. Configure email or Teams/Slack webhook delivery

### Local CI Commands

```bash
# Run the same checks as CI
bun run check:ci

# Run unit tests
bun run test

# Run tests with coverage (same as CI)
bun run test:coverage

# Run E2E tests locally (requires running app on localhost:3000)
bun run test:e2e

# Run E2E tests with interactive UI
bun run test:e2e:ui
```

### 3. Claude Code GitHub Integration (Recommended)

To enable AI-powered code reviews and automated PR assistance, follow these steps:

**Step 1: Open in Claude Code**

```bash
claude
```

**Step 2: Run installation command**

```bash
/install-github-app
```

**Step 3: Follow the interactive prompts**

1. **Select repository**: Choose current repository
2. **Install app**: Press Enter to open browser and install the Claude GitHub App
3. **Configure workflow**: Choose "Update workflow file" or "Skip workflow update"
4. **API key**: Select "Create a long-lived token with your Claude subscription"
5. **Done!** API key is saved as `CLAUDE_CODE_OAUTH_TOKEN` secret

> **What does this enable?** Once installed, you can mention `@claude` in any PR or issue to get AI-powered code analysis, suggestions, and even automated implementations.

### 4. Configure Sentry Seer (AI Error Analysis)

Your project has Sentry error tracking enabled. Configure Seer AI to automatically analyze errors and create fix PRs:

1. Go to [Sentry Seer Settings](https://blogic-sro.sentry.io/settings/projects/map-poster/seer/)
2. Under **"Working Repositories"**, click **"Add Repos"** and select your repository
3. Set **"Where should Seer stop?"** to **Pull Request**
4. Save changes

> **What does this enable?** Seer will automatically analyze errors, find root causes, and create Pull Requests with fixes.

## Architecture

- **apps/web-app** - TanStack Start SSR web application with embedded TRPC server
- **packages/db** - PostgreSQL database schema and migrations (Drizzle ORM)
- **packages/common** - Shared types and utilities
- **packages/logger** - Structured logging with Pino
- **packages/services** - Business logic layer with Effect
- **jobs/pre-deployment** - Pre-deployment migration and setup tasks
- **jobs/post-deployment** - Post-deployment cleanup and verification tasks

## Manual Setup

If you prefer manual setup instead of using `dev.sh`:

```bash
# Install dependencies
bun install

# Start database
docker-compose up -d db

# Run migrations
bun run db:migrate

# Start development server
bun run dev
```

## Database Administration

### Setting Up Admin User

To grant admin privileges to a user:

```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

Replace `'user@example.com'` with the actual user email.

## Versioning & Changelog

This template uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation.

### Staying Updated with the Template

If you forked this template and want to see what new features were added:

1. Check the [CHANGELOG.md](./CHANGELOG.md) for a summary of changes in each version
2. Check the [Releases page](https://github.com/blogic-cz/map-poster/releases) for detailed release notes
3. Compare versions to see exact changes: `https://github.com/blogic-cz/map-poster/compare/v0.0.1...v0.0.2`

To incorporate new features into your project:

1. Review the changelog for the feature you want
2. Check the linked PR for implementation details
3. Adapt the changes to your project (copy files, modify configs, etc.)

### Using Changesets in Your Project

When you make changes to your forked project, document them with changesets:

```bash
# Create a new changeset (interactive)
bunx changeset

# Or create manually in .changeset/my-change.md:
# ---
# "@map-poster/db": minor
# ---
# 
# Add new feature X

# When ready to release, update versions and changelog
bunx changeset version

# Commit the version bump and create a tag
git add -A && git commit -m "chore: release v0.0.x"
git tag v0.0.x && git push origin main --tags
```

**Version types:**
- `patch` (0.0.1 → 0.0.2): Bug fixes, small improvements
- `minor` (0.0.2 → 0.1.0): New features (backwards compatible)
- `major` (0.1.0 → 1.0.0): Breaking changes

## Contributing

1. Create a feature branch
2. Make your changes in the appropriate package
3. Run `bun check`
4. Submit a pull request
