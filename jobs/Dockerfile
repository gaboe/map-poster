# Unified Dockerfile for all jobs
# Uses multi-target build to share base layer (bun install) across all jobs
# Build with: docker build --target <job-name> -f jobs/Dockerfile .
#
# Available targets:
#   - base (shared layer with dependencies)
#   - pre-deployment
#   - post-deployment

# ===== BASE - shared by all jobs =====
FROM oven/bun:1.3.8-slim AS base

# Create app directory with bun ownership
RUN mkdir -p /app && chown bun:bun /app
WORKDIR /app

# Copy package.json files for workspace resolution (ALL workspaces for lockfile)
COPY --chown=bun:bun package.json bun.lock ./
COPY --chown=bun:bun packages/common/package.json ./packages/common/
COPY --chown=bun:bun packages/db/package.json ./packages/db/
COPY --chown=bun:bun packages/logger/package.json ./packages/logger/
COPY --chown=bun:bun packages/services/package.json ./packages/services/
COPY --chown=bun:bun jobs/post-deployment/package.json ./jobs/post-deployment/
COPY --chown=bun:bun jobs/pre-deployment/package.json ./jobs/pre-deployment/
COPY --chown=bun:bun apps/web-app/package.json ./apps/web-app/

# Install dependencies (creates workspace symlinks)
# This is the expensive step that gets cached and shared across all targets
RUN bun install --frozen-lockfile

# Switch to non-root user after install
USER bun

# ===== PRE-DEPLOYMENT =====
# Runs database migrations (depends on: common, db, logger)
FROM base AS pre-deployment
COPY --chown=bun:bun packages/common/src ./packages/common/src
COPY --chown=bun:bun packages/db/src ./packages/db/src
COPY --chown=bun:bun packages/db/drizzle ./packages/db/drizzle
COPY --chown=bun:bun packages/logger/src ./packages/logger/src
COPY --chown=bun:bun jobs/pre-deployment ./jobs/pre-deployment
WORKDIR /app/jobs/pre-deployment
CMD ["bun", "run", "start"]

# ===== POST-DEPLOYMENT =====
# Runs post-deployment tasks (depends on: common, db, services)
FROM base AS post-deployment
COPY --chown=bun:bun packages/common/src ./packages/common/src
COPY --chown=bun:bun packages/db/src ./packages/db/src
COPY --chown=bun:bun packages/db/drizzle ./packages/db/drizzle
COPY --chown=bun:bun packages/logger/src ./packages/logger/src
COPY --chown=bun:bun packages/services/src ./packages/services/src
COPY --chown=bun:bun jobs/post-deployment ./jobs/post-deployment
WORKDIR /app/jobs/post-deployment
CMD ["bun", "run", "start"]
