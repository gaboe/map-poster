# Use official Bun slim image (we install ca-certificates below)
# NOTE: We don't use the temp directory caching pattern from Bun docs
# (https://bun.com/docs/guides/ecosystem/docker#containerize-a-bun-application-with-docker)
# because it doesn't work with Bun workspaces - workspace package dependencies
# stored in .bun/ don't get symlinked to node_modules/ when copied separately.
# Installing directly in /app preserves all workspace symlinks.
FROM oven/bun:1.3.8-slim AS base

# Ensure system CA trust store is present (sentry-cli uses OS certs)
RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root configs
COPY package.json bun.lock tsconfig.json tsconfig.base.json ./

# Copy package.json files for workspace resolution
COPY packages/common/package.json ./packages/common/
COPY packages/db/package.json ./packages/db/
COPY packages/logger/package.json ./packages/logger/
COPY packages/services/package.json ./packages/services/
COPY jobs/pre-deployment/package.json ./jobs/pre-deployment/
COPY jobs/post-deployment/package.json ./jobs/post-deployment/
COPY apps/web-app/package.json ./apps/web-app/

# Install all dependencies including devDependencies needed for build stage
# (Vite build, TypeScript compilation, Sentry sourcemap upload, etc.)
RUN bun install --frozen-lockfile

# Copy packages
COPY packages/common ./packages/common
COPY packages/db ./packages/db
COPY packages/logger ./packages/logger
COPY packages/services ./packages/services

# Copy app code
COPY apps/web-app ./apps/web-app

WORKDIR /app/apps/web-app

# Build argument for environment selection (allowed: dev, test, prod; fallback to prod)
ARG BUILD_ENV=prod
ARG VERSION
ARG GIT_COMMIT_SHA

# Copy environment file
RUN if [ "$BUILD_ENV" = "dev" ]; then \
    cp .env.dev .env; \
    elif [ "$BUILD_ENV" = "test" ]; then \
    cp .env.test .env; \
    else \
    cp .env.prod .env; \
    fi

# Inject VERSION into .env for runtime (Sentry.init())
RUN echo "" >> .env && \
    echo "VERSION=${VERSION}" >> .env && \
    echo "VITE_VERSION=${VERSION}" >> .env

# Build (don't pass SENTRY_AUTH_TOKEN to Vite to avoid failing builds if Sentry is unavailable)
ENV VERSION=${VERSION}
RUN echo "Vite: build starting" && \
    output=$(bun --bun vite build --logLevel warn 2>&1) || { echo "$output"; exit 1; } && \
    echo "Vite: build OK"

# Upload source maps to Sentry (quiet; logs on failure only)
RUN --mount=type=secret,id=sentry_auth_token \
    if [ -f /run/secrets/sentry_auth_token ]; then \
    export SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)"; \
    export SENTRY_ORG="blogic-sro"; \
    export SENTRY_PROJECT="map-poster"; \
    SENTRY_CLI=""; \
    for candidate in /app/node_modules/.bun/@sentry+cli-linux-x64@*/node_modules/@sentry/cli-linux-x64/bin/sentry-cli; do \
    if [ -x "$candidate" ]; then SENTRY_CLI="$candidate"; break; fi; \
    done; \
    RELEASE="$VERSION"; \
    UPLOAD_FAILED=0; \
    if [ ! -x "$SENTRY_CLI" ]; then \
    echo "Sentry: upload FAILED (sentry-cli not found)"; \
    UPLOAD_FAILED=1; \
    fi; \
    if [ "$UPLOAD_FAILED" -eq 0 ]; then \
    echo "Sentry: uploading sourcemaps for $RELEASE"; \
    SENTRY_LOG_LEVEL=warn "$SENTRY_CLI" releases new "$RELEASE" >/dev/null 2>&1 || true; \
    fi; \
    if [ "$UPLOAD_FAILED" -eq 0 ]; then \
    if [ -d "./dist/client/assets" ]; then \
    output=$(SENTRY_LOG_LEVEL=warn "$SENTRY_CLI" sourcemaps inject "./dist/client/assets" 2>&1) || { echo "$output"; UPLOAD_FAILED=1; }; \
    if [ "$UPLOAD_FAILED" -eq 0 ]; then \
    output=$(SENTRY_LOG_LEVEL=warn "$SENTRY_CLI" sourcemaps upload --release "$RELEASE" --dist client --url-prefix '~/assets/' "./dist/client/assets" 2>&1) || { echo "$output"; UPLOAD_FAILED=1; }; \
    fi; \
    else \
    echo "Sentry: upload FAILED (missing ./dist/client/assets)"; \
    UPLOAD_FAILED=1; \
    fi; \
    fi; \
    if [ "$UPLOAD_FAILED" -eq 0 ]; then \
    if [ -d "./dist/server/assets" ]; then \
    output=$(SENTRY_LOG_LEVEL=warn "$SENTRY_CLI" sourcemaps inject "./dist/server/assets" 2>&1) || { echo "$output"; UPLOAD_FAILED=1; }; \
    if [ "$UPLOAD_FAILED" -eq 0 ]; then \
    output=$(SENTRY_LOG_LEVEL=warn "$SENTRY_CLI" sourcemaps upload --release "$RELEASE" --dist server --url-prefix '~/assets/' "./dist/server/assets" 2>&1) || { echo "$output"; UPLOAD_FAILED=1; }; \
    fi; \
    else \
    echo "Sentry: upload FAILED (missing ./dist/server/assets)"; \
    UPLOAD_FAILED=1; \
    fi; \
    fi; \
    if [ "$UPLOAD_FAILED" -eq 0 ]; then \
    echo "Sentry: upload OK"; \
    find ./dist -name "*.map" -delete; \
    else \
    echo "Sentry: upload FAILED (keeping .map files)"; \
    fi; \
    else \
    echo "Sentry: skipping sourcemaps upload (no token)"; \
    fi


# Associate release with git commit SHA (for Sentry Seer code context)
RUN --mount=type=secret,id=sentry_auth_token \
    if [ -f /run/secrets/sentry_auth_token ] && [ -n "$GIT_COMMIT_SHA" ]; then \
    export SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)"; \
    export SENTRY_ORG="blogic-sro"; \
    export SENTRY_PROJECT="map-poster"; \
    SENTRY_CLI=""; \
    for candidate in /app/node_modules/.bun/@sentry+cli-linux-x64@*/node_modules/@sentry/cli-linux-x64/bin/sentry-cli; do \
    if [ -x "$candidate" ]; then SENTRY_CLI="$candidate"; break; fi; \
    done; \
    if [ -x "$SENTRY_CLI" ]; then \
    RELEASE="$VERSION"; \
    output=$("$SENTRY_CLI" releases set-commits "$RELEASE" --commit "blogic-cz/map-poster@$GIT_COMMIT_SHA" 2>&1) || echo "$output"; \
    fi; \
    fi

# --- Production image ---
FROM oven/bun:1.3.8-slim AS prod

# Create app directory with bun ownership
RUN mkdir -p /app && chown bun:bun /app
WORKDIR /app

# Copy package.json files for workspace resolution (ALL workspaces needed for lockfile validation)
COPY --chown=bun:bun package.json bun.lock ./
COPY --chown=bun:bun packages/common/package.json ./packages/common/
COPY --chown=bun:bun packages/db/package.json ./packages/db/
COPY --chown=bun:bun packages/logger/package.json ./packages/logger/
COPY --chown=bun:bun packages/services/package.json ./packages/services/
COPY --chown=bun:bun jobs/pre-deployment/package.json ./jobs/pre-deployment/
COPY --chown=bun:bun jobs/post-deployment/package.json ./jobs/post-deployment/
COPY --chown=bun:bun apps/web-app/package.json ./apps/web-app/

# Install dependencies (creates workspace symlinks)
# Note: --production flag has frozen lockfile bug, so we install all deps
RUN bun install --frozen-lockfile

# Switch to non-root user after install
USER bun

# Copy database files
COPY --from=base --chown=bun:bun /app/packages/db/drizzle.config.ts ./packages/db/
COPY --from=base --chown=bun:bun /app/packages/db/drizzle ./packages/db/drizzle

# Copy logger package (required for server logging)
COPY --from=base --chown=bun:bun /app/packages/logger ./packages/logger

# Copy build outputs and server entry
COPY --from=base --chown=bun:bun /app/apps/web-app/dist ./apps/web-app/dist
COPY --from=base --chown=bun:bun /app/apps/web-app/server.ts ./apps/web-app/
COPY --from=base --chown=bun:bun /app/apps/web-app/.env ./apps/web-app/

# Copy assets (fonts for OG image generation)
COPY --from=base --chown=bun:bun /app/apps/web-app/src/assets/fonts ./apps/web-app/src/assets/fonts

WORKDIR /app/apps/web-app

# Set port (same as in vite.config.ts)
ENV PORT=3000
ENV ASSET_PRELOAD_MAX_SIZE=10485760
ENV STATIC_PRELOAD_VERBOSE=true
EXPOSE 3000

# Start Bun production server
CMD ["bun", "run", "server.ts"]
