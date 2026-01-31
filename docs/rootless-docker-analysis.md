# Rootless Docker Images Analysis

This document analyzes the current state of Docker images in the map-poster repository and proposes solutions for implementing rootless containers.

## Current State Analysis

### Docker Images Overview

The repository contains three Dockerfiles:

| Image           | Location                          | Base Image              | Current User   |
| --------------- | --------------------------------- | ----------------------- | -------------- |
| web-app         | `apps/web-app/Dockerfile`         | `oven/bun:1.3.3-alpine` | root (default) |
| pre-deployment  | `jobs/pre-deployment/Dockerfile`  | `oven/bun:1.3.3-alpine` | root (default) |
| post-deployment | `jobs/post-deployment/Dockerfile` | `oven/bun:1.3.3-alpine` | root (default) |

### Current Kubernetes Security Context

#### Helm Hook Jobs (pre-install, post-install)

The Helm hook jobs in `kubernetes/helm/web-app/templates/` already implement proper rootless configuration:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

#### Standalone Job Charts (pre-deployment, post-deployment)

The standalone charts in `kubernetes/helm/pre-deployment/` and `kubernetes/helm/post-deployment/` also have proper security context in values:

```yaml
podSecurityContext:
  fsGroup: 1000

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
    - ALL
```

#### Main Web App Deployment

**Issue identified**: The main web-app deployment has empty security contexts:

```yaml
podSecurityContext:
  {}

securityContext:
  {}
```

This means the web-app container runs as root by default.

### Bun Base Image Analysis

The `oven/bun:1.3.3-alpine` image:

- Runs as root by default
- Does not create a non-root user out of the box
- Application files are owned by root

## Gap Analysis

| Component           | Dockerfile Rootless | Helm Security Context | Status         |
| ------------------- | ------------------- | --------------------- | -------------- |
| web-app             | No                  | No                    | **Needs work** |
| pre-deployment job  | No                  | Yes                   | Partial        |
| post-deployment job | No                  | Yes                   | Partial        |
| Helm hook jobs      | No                  | Yes                   | Partial        |

**Key finding**: While Kubernetes security contexts attempt to run as non-root user 1000, the Docker images themselves don't create this user or set proper file ownership. This can cause permission issues.

## Proposed Solution

### Option 1: Modify Dockerfiles (Recommended)

Create a non-root user in each Dockerfile and ensure proper file ownership.

#### Web App Dockerfile Changes

```dockerfile
# --- Production image ---
FROM oven/bun:1.3.3-alpine AS prod

# Create non-root user with specific UID/GID
RUN addgroup -g 1000 bun && \
    adduser -u 1000 -G bun -s /bin/sh -D bun

WORKDIR /app/apps/web-app

# Copy files with proper ownership
COPY --from=base --chown=bun:bun /app/package.json /app/
COPY --from=base --chown=bun:bun /app/apps/web-app/package.json ./
COPY --from=base --chown=bun:bun /app/bun.lock /app/
COPY --from=base --chown=bun:bun /app/packages/db/drizzle.config.ts /app/packages/db/
COPY --from=base --chown=bun:bun /app/packages/db/drizzle /app/packages/db/drizzle
COPY --from=base --chown=bun:bun /app/packages/logger /app/packages/logger
COPY --from=base --chown=bun:bun /app/node_modules /app/node_modules
COPY --from=base --chown=bun:bun /app/apps/web-app/node_modules ./node_modules
COPY --from=base --chown=bun:bun /app/apps/web-app/dist ./dist
COPY --from=base --chown=bun:bun /app/apps/web-app/server.ts ./
COPY --from=base --chown=bun:bun /app/apps/web-app/src/assets/fonts ./src/assets/fonts

# Create logs directory with proper ownership
RUN mkdir -p /app/logs && chown -R bun:bun /app/logs

# Switch to non-root user
USER bun

ENV PORT=3000
ENV ASSET_PRELOAD_MAX_SIZE=10485760
ENV STATIC_PRELOAD_VERBOSE=true

CMD ["bun", "run", "server.ts"]
```

#### Pre-deployment Dockerfile Changes

```dockerfile
FROM oven/bun:1.3.3-alpine

# Create non-root user
RUN addgroup -g 1000 bun && \
    adduser -u 1000 -G bun -s /bin/sh -D bun

WORKDIR /app

# Copy and install as root first
COPY package.json bun.lock tsconfig.json tsconfig.base.json ./
COPY packages/common/package.json ./packages/common/
COPY packages/db/package.json ./packages/db/
COPY packages/logger/package.json ./packages/logger/
COPY packages/services/package.json ./packages/services/
COPY jobs/pre-deployment/package.json ./jobs/pre-deployment/
COPY jobs/post-deployment/package.json ./jobs/post-deployment/
COPY apps/web-app/package.json ./apps/web-app/

RUN bun install --frozen-lockfile --ignore-scripts

COPY packages/common ./packages/common
COPY packages/db ./packages/db
COPY packages/logger ./packages/logger
COPY jobs/pre-deployment ./jobs/pre-deployment

# Set ownership and switch to non-root user
RUN chown -R bun:bun /app
USER bun

WORKDIR /app/jobs/pre-deployment

CMD ["bun", "run", "start"]
```

#### Post-deployment Dockerfile Changes

```dockerfile
FROM oven/bun:1.3.3-alpine

# Create non-root user
RUN addgroup -g 1000 bun && \
    adduser -u 1000 -G bun -s /bin/sh -D bun

WORKDIR /app

COPY package.json bun.lock tsconfig.json tsconfig.base.json ./
COPY packages/common/package.json ./packages/common/
COPY packages/db/package.json ./packages/db/
COPY packages/logger/package.json ./packages/logger/
COPY packages/services/package.json ./packages/services/
COPY jobs/pre-deployment/package.json ./jobs/pre-deployment/
COPY jobs/post-deployment/package.json ./jobs/post-deployment/
COPY apps/web-app/package.json ./apps/web-app/

RUN bun install --frozen-lockfile --ignore-scripts

COPY packages/common ./packages/common
COPY packages/db ./packages/db
COPY packages/logger ./packages/logger
COPY packages/services ./packages/services
COPY jobs/post-deployment ./jobs/post-deployment

# Set ownership and switch to non-root user
RUN chown -R bun:bun /app
USER bun

WORKDIR /app/jobs/post-deployment

CMD ["bun", "run", "start"]
```

### Option 2: Use Distroless Base Image

An alternative approach using Google's distroless images for even smaller attack surface:

```dockerfile
# Build stage remains the same
FROM oven/bun:1.3.3-alpine AS base
# ... build steps ...

# Production stage with distroless
FROM gcr.io/distroless/cc-debian12:nonroot AS prod

COPY --from=base /usr/local/bin/bun /usr/local/bin/bun
COPY --from=base --chown=nonroot:nonroot /app /app

WORKDIR /app/apps/web-app
USER nonroot

CMD ["bun", "run", "server.ts"]
```

**Note**: This option requires testing as Bun may have dependencies not available in distroless images.

### Helm Values Changes

#### Web App Values (values.test.yaml, values.prod.yaml)

Add security contexts to match the job configurations:

```yaml
podSecurityContext:
  fsGroup: 1000
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

#### Volume Considerations

For the production values file that mounts a logs PVC:

```yaml
volumes:
  - name: logs
    persistentVolumeClaim:
      claimName: map-poster-web-app-logs
  - name: tmp
    emptyDir: {}

volumeMounts:
  - name: logs
    mountPath: /app/logs
  - name: tmp
    mountPath: /tmp
```

The PVC must be configured with proper ownership (fsGroup: 1000 handles this via Kubernetes).

## Implementation Checklist

### Phase 1: Docker Images

- [ ] Update `apps/web-app/Dockerfile` with non-root user
- [ ] Update `jobs/pre-deployment/Dockerfile` with non-root user
- [ ] Update `jobs/post-deployment/Dockerfile` with non-root user
- [ ] Test images locally with `docker run --user 1000:1000`

### Phase 2: Helm Charts

- [ ] Update `kubernetes/helm/web-app/values.test.yaml` with security contexts
- [ ] Update `kubernetes/helm/web-app/values.prod.yaml` with security contexts
- [ ] Add tmp volume for temporary file operations
- [ ] Run `helm lint` on all charts
- [ ] Run `helm template` to verify output

### Phase 3: Testing

- [ ] Build and test all images locally
- [ ] Deploy to test environment
- [ ] Verify application functionality
- [ ] Check logs for permission errors
- [ ] Verify PVC mounts work correctly

### Phase 4: Production

- [ ] Deploy to production with staged rollout
- [ ] Monitor for permission-related issues
- [ ] Update CI/CD documentation

## Security Benefits

1. **Principle of Least Privilege**: Containers run with minimal required permissions
2. **Defense in Depth**: Even if container is compromised, attacker has limited capabilities
3. **Compliance**: Meets CIS Kubernetes Benchmark requirements
4. **Pod Security Standards**: Compatible with `restricted` policy level

## Potential Issues and Mitigations

### Issue 1: File Permission Errors

**Symptom**: Application cannot write to filesystem
**Mitigation**: Ensure all writable directories are either:

- Owned by user 1000 in the image
- Mounted as emptyDir with fsGroup
- Using PVC with proper ownership

### Issue 2: npm/bun Cache

**Symptom**: Package installation fails
**Mitigation**: Build-time operations run as root, only runtime switches to non-root

### Issue 3: Existing PVC Data

**Symptom**: Cannot access existing PVC data after migration
**Mitigation**: Either:

- Use `fsGroup` to automatically change ownership
- Run a one-time job to `chown` existing data

## Recommendations

1. **Start with Option 1** (Dockerfile modifications) as it's the most straightforward and maintains compatibility with existing infrastructure

2. **Test thoroughly** in the test environment before production deployment

3. **Consider Pod Security Policies/Standards**: Once rootless is implemented, enable Kubernetes Pod Security Standards at the namespace level:

   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: map-poster
     labels:
       pod-security.kubernetes.io/enforce: restricted
       pod-security.kubernetes.io/audit: restricted
       pod-security.kubernetes.io/warn: restricted
   ```

4. **Monitor with Falco or similar**: Consider runtime security monitoring to detect any privilege escalation attempts
