# Offline OpenStreetMap Data Support + Infrastructure Migration

## TL;DR

> **Quick Summary**: Migrate from Kubernetes to Coolify, then replace Overpass API calls with local PostGIS queries for Czech Republic and Slovakia OSM data, achieving 10-50x speedup in poster generation.
>
> **Deliverables**:
>
> - Docker Compose configuration for local dev and Coolify deployment
> - Kubernetes/Helm files deleted
> - Python API admin routes for triggering OSM imports
> - Modified `poster_service.py` to query PostGIS instead of Overpass
> - TRPC admin router (`admin.osmData.*`)
> - Admin UI at `/app/admin/osm-data`
>
> **Estimated Effort**: Large (8 phases, ~5-7 days)
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

---

## Context

### Original Request

1. Migrate infrastructure from Kubernetes/Helm to Coolify (self-hosted PaaS)
2. Add offline OpenStreetMap data support by downloading full CZ and SK data from Geofabrik
3. Import into PostGIS for fast local queries
4. Provide admin panel to manage downloads/updates

### Interview Summary

**Key Discussions**:

- Infrastructure: Migrate from K8s to Coolify at `clf.gaboe.xyz`
- PostGIS: Use `postgis/postgis:18-3.6` Docker image on Coolify
- Progress tracking: Database table (survives restarts)
- Fallback: None - fail fast with clear error
- PBF storage: Ephemeral (delete after import)
- Testing: Unit tests for critical paths

**Research Findings**:

- Existing TRPC pattern for long-running jobs: `generatePreview` → `getStatus` polling
- Python API uses `asyncio.Queue` + `ThreadPoolExecutor(max_workers=2)`
- Admin UI at `/app/admin` with StatCard, DataTable components
- Coolify supports Docker Compose deployments natively
- Server has 3GB RAM, 38GB disk - may need upgrade for OSM import (4-8GB recommended)

### Metis Review

**Identified Gaps** (addressed):

- osm2pgsql schema mismatch with OSMnx: Added Phase 1 validation
- Server capacity: Added RAM upgrade recommendation
- Import OOM risk: Documented in server requirements
- Concurrent poster generation during import: Added handling strategy

**Guardrails Applied**:

- Only Czech Republic and Slovakia (hardcoded)
- Full re-import only (no incremental diffs)
- Polling for progress (no WebSocket)
- Manual trigger only (no scheduled updates)
- One import at a time (no concurrent imports)

---

## Architecture

### Target Architecture (Coolify)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COOLIFY (clf.gaboe.xyz)                        │
│                      Hetzner Cloud Server                           │
│                      (Recommend: 4-8GB RAM for OSM import)          │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │   web-app   │  │     api     │  │   PostgreSQL + PostGIS      │ │
│  │  (Bun/Node) │  │  (Python)   │  │   postgis/postgis:18-3.6    │ │
│  │  Port 3000  │  │  Port 8000  │  │   Port 5432                 │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┬───────────────┘ │
│         │                │                       │                  │
│         └────────────────┼───────────────────────┘                  │
│                          │                                          │
│                    Traefik Proxy                                    │
│                    (SSL, routing)                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Work Objectives

### Core Objective

1. Replace Kubernetes deployment with Coolify-based Docker Compose deployment
2. Replace slow Overpass API calls (5-30s per poster) with fast PostGIS queries (<1s)

### Concrete Deliverables

1. `docker-compose.yml` for local development
2. `docker-compose.prod.yml` for Coolify production deployment
3. Kubernetes/Helm directory deleted
4. CLAUDE.md updated (K8s references removed)
5. PostgreSQL with PostGIS running on Coolify
6. `osm_data_sources` table in `packages/db/src/schema.ts`
7. Python admin routes: `POST /api/admin/osm/import/{source_id}`, `GET /api/admin/osm/status`
8. Modified `poster_service.py` with `fetch_graph_postgis()` and `fetch_features_postgis()`
9. TRPC router `admin.osmData` with `list`, `startImport`, `getStatus` procedures
10. Admin UI page at `/app/admin/osm-data`

### Definition of Done

- [ ] App runs locally with `docker compose up`
- [ ] App deployed to Coolify and accessible via domain
- [ ] Kubernetes directory completely removed
- [ ] Admin can trigger import for CZ or SK from UI
- [ ] Import progress visible in admin panel (polling every 5s)
- [ ] Poster generation uses PostGIS (verified by timing <5s vs 30s+)
- [ ] Error shown when requesting location outside imported regions

### Must Have

- Docker Compose files for local and production
- PostGIS extension via official Docker image
- Status tracking in database table
- Admin-only access to import controls
- Clear error messages for unimported regions

### Must NOT Have (Guardrails)

- Kubernetes/Helm files (must be deleted)
- Support for regions beyond CZ/SK
- WebSocket progress updates
- Incremental/diff OSM updates
- Scheduled automatic updates
- Generic "add any region" functionality
- Fallback to Overpass API
- Concurrent imports (one at a time)

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: YES (bun test)
- **User wants tests**: Unit tests for critical paths
- **Framework**: bun test

### Automated Verification Approach

| Type               | Verification Method                        |
| ------------------ | ------------------------------------------ |
| Docker Compose     | `docker compose up` + health checks        |
| Coolify deployment | curl to production URL                     |
| Database schema    | SQL queries via psql                       |
| Python API         | curl commands with jq assertions           |
| TRPC router        | curl to TRPC endpoint with JSON assertions |
| Frontend UI        | Playwright browser automation              |
| PostGIS queries    | bun test with test database                |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 0.1: Create Docker Compose files
├── Task 0.2: Delete Kubernetes files
└── Task 1: Validate osm2pgsql approach with small extract

Wave 2 (After Wave 1):
├── Task 0.3: Configure Coolify deployment
├── Task 0.4: Update documentation (CLAUDE.md)
└── Task 2: Update Python API Dockerfile with OSM tools

Wave 3 (After Coolify deployed):
├── Task 3: Database schema (osm_data_sources table)
├── Task 4: Python API admin routes
└── Task 5: TRPC admin router

Wave 4 (After Tasks 3, 4, 5):
├── Task 6: Replace poster_service.py OSM fetching
├── Task 7: Admin UI page
└── Task 8: Testing & Documentation

Critical Path: Task 0.1 → Task 0.3 → Task 3 → Task 4 → Task 6
```

### Dependency Matrix

| Task | Depends On | Blocks  | Can Parallelize With |
| ---- | ---------- | ------- | -------------------- |
| 0.1  | None       | 0.3     | 0.2, 1               |
| 0.2  | None       | 0.4     | 0.1, 1               |
| 0.3  | 0.1        | 3, 4, 5 | 0.4, 2               |
| 0.4  | 0.2        | None    | 0.3, 2               |
| 1    | None       | 6       | 0.1, 0.2             |
| 2    | None       | 4, 6    | 0.3, 0.4             |
| 3    | 0.3        | 4, 5, 6 | None                 |
| 4    | 2, 3       | 6       | 5                    |
| 5    | 3          | 7       | 4                    |
| 6    | 1, 4       | 7, 8    | None                 |
| 7    | 5, 6       | 8       | None                 |
| 8    | 7          | None    | None                 |

---

## TODOs

### Phase 0: Infrastructure Migration (K8s → Coolify)

- [ ] 0.1. Create Docker Compose files for local development and Coolify

  **What to do**:
  - Create `docker-compose.yml` for local development
  - Create `docker-compose.prod.yml` for Coolify production
  - Services: `db` (PostGIS), `web-app`, `api` (Python)
  - Use `postgis/postgis:18-3.6` image for database
  - Configure volumes for persistent data
  - Set up environment variables structure

  **Must NOT do**:
  - Keep any Kubernetes references
  - Add Redis or other services not currently needed
  - Expose database port in production

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Configuration file creation following Docker patterns
  - **Skills**: []
    - Standard Docker Compose knowledge

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 0.2, 1)
  - **Blocks**: Task 0.3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `docker-compose.yaml` (existing) - Current local dev setup pattern
  - User-provided Docker Compose structure in requirements

  **Docker Compose Structure**:

  ```yaml
  # docker-compose.yml (local development)
  services:
    db:
      image: postgis/postgis:18-3.6
      environment:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: map_poster
      volumes:
        - postgres-data:/var/lib/postgresql/data
      ports:
        - "5432:5432"
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U postgres"]
        interval: 5s
        timeout: 5s
        retries: 5

    web-app:
      build: ./apps/web-app
      environment:
        DATABASE_URL: postgresql://postgres:postgres@db:5432/map_poster
        MAP_POSTER_API_URL: http://api:8000
      ports:
        - "3000:3000"
      depends_on:
        db:
          condition: service_healthy

    api:
      build: ./apps/api
      environment:
        DATABASE_URL: postgresql://postgres:postgres@db:5432/map_poster
      volumes:
        - osm-cache:/app/cache
        - osm-posters:/app/posters
      ports:
        - "8000:8000"
      depends_on:
        db:
          condition: service_healthy

  volumes:
    postgres-data:
    osm-cache:
    osm-posters:
  ```

  ```yaml
  # docker-compose.prod.yml (Coolify production)
  services:
    db:
      image: postgis/postgis:18-3.6
      environment:
        POSTGRES_USER: ${POSTGRES_USER}
        POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
        POSTGRES_DB: ${POSTGRES_DB}
      volumes:
        - postgres-data:/var/lib/postgresql/data
      # No external ports in production
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
        interval: 10s
        timeout: 5s
        retries: 5

    web-app:
      build: ./apps/web-app
      environment:
        DATABASE_URL: ${DATABASE_URL}
        MAP_POSTER_API_URL: http://api:8000
        BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
        BETTER_AUTH_URL: ${BETTER_AUTH_URL}
        BASE_URL: ${BASE_URL}
        SENTRY_DSN: ${SENTRY_DSN}
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.web.rule=Host(`${DOMAIN}`)"
        - "traefik.http.services.web.loadbalancer.server.port=3000"
      depends_on:
        db:
          condition: service_healthy

    api:
      build: ./apps/api
      environment:
        DATABASE_URL: ${DATABASE_URL}
      volumes:
        - osm-cache:/app/cache
        - osm-posters:/app/posters
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.api.rule=Host(`${DOMAIN}`) && PathPrefix(`/api`)"
        - "traefik.http.services.api.loadbalancer.server.port=8000"
      depends_on:
        db:
          condition: service_healthy

  volumes:
    postgres-data:
    osm-cache:
    osm-posters:
  ```

  **Acceptance Criteria**:

  ```bash
  # 1. Verify docker-compose.yml exists and is valid
  docker compose config
  # Assert: No errors, outputs valid config

  # 2. Start local development stack
  docker compose up -d
  # Assert: All services start successfully

  # 3. Verify PostGIS is available
  docker compose exec db psql -U postgres -c "SELECT PostGIS_Version();"
  # Assert: Returns version string like "3.4..."

  # 4. Verify web-app is accessible
  curl -s http://localhost:3000 | head -1
  # Assert: Returns HTML

  # 5. Verify api is accessible
  curl -s http://localhost:8000/api/health | jq
  # Assert: Returns {"status": "ok"}

  # 6. Verify docker-compose.prod.yml exists
  ls docker-compose.prod.yml
  # Assert: File exists

  # 7. Stop and cleanup
  docker compose down
  # Assert: Services stopped
  ```

  **Commit**: YES
  - Message: `feat(infra): add Docker Compose files for local dev and Coolify deployment`
  - Files: `docker-compose.yml`, `docker-compose.prod.yml`
  - Pre-commit: `docker compose config`

---

- [ ] 0.2. Delete Kubernetes/Helm files

  **What to do**:
  - Delete entire `kubernetes/` directory
  - Remove any K8s-related scripts or references
  - Update `.gitignore` if needed

  **Must NOT do**:
  - Keep any Kubernetes files "for reference"
  - Create backup copies

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file deletion
  - **Skills**: []
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 0.1, 1)
  - **Blocks**: Task 0.4
  - **Blocked By**: None

  **References**:
  - `kubernetes/helm/` - Directory to delete

  **Acceptance Criteria**:

  ```bash
  # 1. Delete kubernetes directory
  rm -rf kubernetes/
  # Assert: Directory removed

  # 2. Verify deletion
  ls kubernetes/ 2>&1
  # Assert: "No such file or directory"

  # 3. Verify no K8s references in root
  find . -name "*.yaml" -path "*/kubernetes/*" 2>/dev/null | wc -l
  # Assert: 0
  ```

  **Commit**: YES
  - Message: `chore(infra): remove Kubernetes/Helm configuration`
  - Files: `kubernetes/` (deleted)
  - Pre-commit: None

---

- [ ] 0.3. Configure Coolify deployment

  **What to do**:
  - Create project "map-poster" in Coolify at `clf.gaboe.xyz`
  - Deploy PostgreSQL with PostGIS image (`postgis/postgis:18-3.6`)
  - Deploy web-app from GitHub repository
  - Deploy api (Python FastAPI) from GitHub repository
  - Configure environment variables for all services
  - Set up domains and SSL via Traefik
  - Configure persistent volumes for database and OSM data
  - Document deployment process

  **Must NOT do**:
  - Expose database port publicly
  - Store secrets in docker-compose files
  - Skip SSL configuration

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: External service configuration requiring careful setup
  - **Skills**: []
    - Coolify administration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 0.4, 2)
  - **Blocks**: Tasks 3, 4, 5
  - **Blocked By**: Task 0.1

  **References**:
  - Coolify URL: https://clf.gaboe.xyz
  - Coolify API: `GET /api/v1/deploy?uuid={app_uuid}`
  - PostGIS image: `postgis/postgis:18-3.6`

  **Environment Variables to Configure**:

  ```
  # Database
  POSTGRES_USER=map_poster
  POSTGRES_PASSWORD=<generate-secure-password>
  POSTGRES_DB=map_poster

  # Web App
  DATABASE_URL=postgresql://map_poster:<password>@db:5432/map_poster
  MAP_POSTER_API_URL=http://api:8000
  BETTER_AUTH_SECRET=<generate-secure-secret>
  BETTER_AUTH_URL=https://<your-domain>
  BASE_URL=https://<your-domain>
  SENTRY_DSN=<from-existing-config>
  BREVO_API_KEY=<from-existing-config>

  # API
  DATABASE_URL=postgresql://map_poster:<password>@db:5432/map_poster
  ```

  **Server Capacity Note**:
  - Current: 3GB RAM, 38GB disk
  - OSM import needs: 2-4GB RAM temporarily
  - **Recommendation**: Upgrade Hetzner server to 4-8GB RAM before OSM import

  **Acceptance Criteria**:

  ```bash
  # 1. Verify Coolify project exists
  # Manual: Check https://clf.gaboe.xyz for "map-poster" project

  # 2. Verify database is running with PostGIS
  # From Coolify terminal or via app:
  psql $DATABASE_URL -c "SELECT PostGIS_Version();"
  # Assert: Returns "3.4..."

  # 3. Verify web-app is accessible
  curl -s https://<your-domain>/ | head -1
  # Assert: Returns HTML

  # 4. Verify api health check
  curl -s https://<your-domain>/api/health | jq
  # Assert: Returns {"status": "ok"}

  # 5. Verify SSL is working
  curl -sI https://<your-domain> | grep -i "strict-transport"
  # Assert: Returns HSTS header

  # 6. Document deployment URL
  echo "Production URL: https://<your-domain>" >> docs/deployment.md
  ```

  **Evidence to Capture**:
  - [ ] Screenshot of Coolify dashboard with all services running
  - [ ] Production URL documented
  - [ ] Environment variables list (without secrets)

  **Commit**: YES
  - Message: `docs(infra): add Coolify deployment documentation`
  - Files: `docs/deployment.md` (new), `README.md` (update deployment section)
  - Pre-commit: None

---

- [ ] 0.4. Update CLAUDE.md and documentation

  **What to do**:
  - Remove all Kubernetes/Helm references from CLAUDE.md
  - Update deployment instructions for Coolify
  - Remove K8s tool references (kubectl, helm, az)
  - Add Docker Compose commands
  - Update architecture documentation

  **Must NOT do**:
  - Keep any K8s references "just in case"
  - Remove unrelated documentation

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Documentation updates
  - **Skills**: []
    - Markdown editing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 0.3, 2)
  - **Blocks**: None
  - **Blocked By**: Task 0.2

  **References**:
  - `CLAUDE.md` - Main documentation file to update
  - `README.md` - Project readme
  - `docs/architecture.md` - Architecture documentation

  **Changes Required in CLAUDE.md**:
  1. Remove from "Available Tools" section:
     - `k8s-tool` references
     - `kubectl` references
     - `az` Azure CLI references (if K8s specific)
  2. Remove from "Environment Infrastructure":
     - Helm values files references
     - Kubernetes references
  3. Update "Project Overview" section:
     - Remove "Kubernetes + Docker: Production deployment"
     - Add "Docker Compose + Coolify: Production deployment"
  4. Remove entire sections:
     - "Helm Values Structure"
     - "Adding Environment Variables to Helm"
     - Production/Test Environment Troubleshooting K8s parts
  5. Add new section:

     ````markdown
     ### Docker Compose Deployment

     **Local Development:**

     ```bash
     docker compose up -d      # Start all services
     docker compose logs -f    # View logs
     docker compose down       # Stop all services
     ```
     ````

     **Production (Coolify):**
     - Managed via Coolify dashboard at clf.gaboe.xyz
     - Uses docker-compose.prod.yml
     - Environment variables configured in Coolify UI

     ```

     ```

  **Acceptance Criteria**:

  ```bash
  # 1. Verify no K8s references in CLAUDE.md
  grep -i "kubernetes\|helm\|kubectl\|k8s-tool" CLAUDE.md | wc -l
  # Assert: 0

  # 2. Verify Docker Compose documented
  grep -i "docker compose\|docker-compose" CLAUDE.md | head -3
  # Assert: Returns lines with Docker Compose commands

  # 3. Verify Coolify mentioned
  grep -i "coolify" CLAUDE.md | head -1
  # Assert: Returns mention of Coolify

  # 4. Verify no broken references
  # Manual: Review CLAUDE.md for any orphaned references
  ```

  **Commit**: YES
  - Message: `docs: update documentation for Coolify deployment (remove K8s)`
  - Files: `CLAUDE.md`, `README.md`, `docs/architecture.md`
  - Pre-commit: None

---

### Phase 1: Validation

- [ ] 1. Validate osm2pgsql approach with small test extract

  **What to do**:
  - Download a small OSM extract (e.g., Prague only ~50MB)
  - Run osm2pgsql to import into test PostGIS database
  - Write test queries to extract roads, water, parks
  - Verify data can construct graph-like structure for rendering
  - Document query patterns for Phase 4

  **Must NOT do**:
  - Import full Czech or Slovakia data
  - Modify production code
  - Skip validation even if "obvious"

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Research/validation task requiring deep technical investigation
  - **Skills**: []
    - No specific skills needed - this is exploratory research

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 0.1, 0.2)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:
  - `apps/api/app/poster_service.py:228-295` - Current fetch_graph and fetch_features implementations
  - `apps/api/app/poster_service.py:302-370` - get_edge_colors_by_type showing highway attribute usage
  - Geofabrik extracts: https://download.geofabrik.de/europe/czech-republic.html
  - osm2pgsql docs: https://osm2pgsql.org/doc/manual.html

  **Acceptance Criteria**:

  ```bash
  # 1. Download small extract
  wget https://download.geofabrik.de/europe/czech-republic/praha-latest.osm.pbf -O /tmp/praha.osm.pbf
  # Assert: File exists and is ~50MB

  # 2. Create test database with PostGIS (using local docker compose)
  docker compose exec db psql -U postgres -c "CREATE DATABASE osm_test;"
  docker compose exec db psql -U postgres -d osm_test -c "CREATE EXTENSION IF NOT EXISTS postgis;"
  # Assert: No errors

  # 3. Import with osm2pgsql
  osm2pgsql -d postgresql://postgres:postgres@localhost:5432/osm_test /tmp/praha.osm.pbf
  # Assert: Import completes, tables created

  # 4. Verify road data extractable
  docker compose exec db psql -U postgres -d osm_test -c \
    "SELECT highway, COUNT(*) FROM planet_osm_line WHERE highway IS NOT NULL GROUP BY highway LIMIT 10;"
  # Assert: Returns rows with highway types

  # 5. Verify water features
  docker compose exec db psql -U postgres -d osm_test -c \
    "SELECT COUNT(*) FROM planet_osm_polygon WHERE \"natural\" = 'water' OR waterway = 'riverbank';"
  # Assert: Returns count > 0

  # 6. Verify parks
  docker compose exec db psql -U postgres -d osm_test -c \
    "SELECT COUNT(*) FROM planet_osm_polygon WHERE leisure = 'park' OR landuse = 'grass';"
  # Assert: Returns count > 0

  # 7. Test spatial query with bbox (Prague center)
  docker compose exec db psql -U postgres -d osm_test -c \
    "SELECT COUNT(*) FROM planet_osm_line WHERE highway IS NOT NULL AND way && ST_MakeEnvelope(14.40, 50.05, 14.50, 50.12, 4326);"
  # Assert: Returns count > 100
  ```

  **Commit**: NO (research task, no code changes)

---

### Phase 2: Docker Image Update

- [ ] 2. Update Python API Docker image with OSM tools

  **What to do**:
  - Add `osmium-tool` to Dockerfile
  - Add `osm2pgsql` to Dockerfile
  - Add `psycopg2` or `asyncpg` for database connection
  - Verify tools are accessible from non-root user
  - Update `.env.example` with `DATABASE_URL`

  **Must NOT do**:
  - Switch to Alpine (geopandas compilation issues)
  - Add unnecessary tools beyond osmium and osm2pgsql

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Dockerfile modification, straightforward
  - **Skills**: []
    - Standard Docker configuration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 0.3, 0.4)
  - **Blocks**: Tasks 4, 6
  - **Blocked By**: None

  **References**:
  - `apps/api/Dockerfile` - Current multi-stage build pattern

  **Dockerfile Changes**:

  ```dockerfile
  # In runtime stage - add system dependencies
  FROM python:3.12-slim

  # Install runtime dependencies including OSM tools
  RUN apt-get update && apt-get install -y --no-install-recommends \
      osmium-tool \
      osm2pgsql \
      libpq5 \
      && rm -rf /var/lib/apt/lists/*

  # ... rest of runtime
  ```

  **Acceptance Criteria**:

  ```bash
  # 1. Build Docker image
  cd apps/api && docker build -t map-poster-api:test .
  # Assert: Build completes successfully

  # 2. Verify osmium-tool installed
  docker run --rm map-poster-api:test which osmium
  # Assert: Returns path

  # 3. Verify osm2pgsql installed
  docker run --rm map-poster-api:test which osm2pgsql
  # Assert: Returns path

  # 4. Verify database driver
  docker run --rm map-poster-api:test /app/.venv/bin/python -c "import psycopg2; print('ok')"
  # Assert: Prints "ok"

  # 5. Verify tools accessible as non-root
  docker run --rm --user 1000:1000 map-poster-api:test which osmium osm2pgsql
  # Assert: Returns paths to both tools
  ```

  **Commit**: YES
  - Message: `build(api): add osmium-tool and osm2pgsql to Docker image`
  - Files: `apps/api/Dockerfile`, `apps/api/pyproject.toml`, `apps/api/.env.example`
  - Pre-commit: `docker build -t map-poster-api:test apps/api`

---

### Phase 3: Database Schema

- [ ] 3. Add osm_data_sources table

  **What to do**:
  - Add `OsmDataSourceId` branded type to `packages/common/src/osm/ids.ts`
  - Add `OsmDataSourceStatus` type with values: `pending | downloading | converting | importing | completed | failed`
  - Add `osmDataSourcesTable` to `packages/db/src/schema.ts`
  - Create migration
  - Seed initial rows for Czech Republic and Slovakia sources
  - Note: PostGIS extension already available from `postgis/postgis:18-3.6` image

  **Must NOT do**:
  - Add additional regions beyond CZ/SK
  - Create separate tables for each region
  - Try to enable PostGIS manually (image has it)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file changes following established patterns
  - **Skills**: [`drizzle-database`]
    - `drizzle-database`: Database schema patterns, branded IDs, migrations

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential start)
  - **Blocks**: Tasks 4, 5, 6
  - **Blocked By**: Task 0.3

  **References**:

  **Pattern References**:
  - `packages/db/src/schema.ts:28-49` - usersTable pattern
  - `packages/db/src/schema.ts:223-260` - invitationsTable pattern for status field
  - `packages/common/src/projects/ids.ts` - Pattern for branded ID definition

  **Schema Structure**:

  ```typescript
  // packages/common/src/osm/ids.ts
  export type OsmDataSourceId = string & { readonly _brand: "OsmDataSourceId" };
  export const OsmDataSourceId = Schema.String.pipe(
    Schema.brand("OsmDataSourceId"),
  );

  export type OsmDataSourceStatusValue =
    | "pending"
    | "downloading"
    | "converting"
    | "importing"
    | "completed"
    | "failed";

  // packages/db/src/schema.ts
  export const osmDataSourcesTable = pgTable("osm_data_sources", {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId())
      .$type<OsmDataSourceId>(),
    name: text("name").notNull(), // "Czech Republic" | "Slovakia"
    code: text("code").notNull().unique(), // "cz" | "sk"
    geofabrikUrl: text("geofabrik_url").notNull(),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
    status: text("status")
      .$type<OsmDataSourceStatusValue>()
      .default("pending")
      .notNull(),
    progress: integer("progress").default(0).notNull(),
    errorMessage: text("error_message"),
    lastImportedAt: timestamp("last_imported_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  });
  ```

  **Acceptance Criteria**:

  ```bash
  # 1. Verify types exist
  bun run check
  # Assert: No TypeScript errors

  # 2. Run migration
  bun run db:migrate
  # Assert: Migration completes

  # 3. Verify PostGIS available (from Docker image)
  docker compose exec db psql -U postgres -d map_poster -c "SELECT PostGIS_Version();"
  # Assert: Returns "3.4..."

  # 4. Verify table created
  docker compose exec db psql -U postgres -d map_poster -c "\\d osm_data_sources"
  # Assert: Shows all columns

  # 5. Verify seed data
  docker compose exec db psql -U postgres -d map_poster -c "SELECT code, name, status FROM osm_data_sources ORDER BY code;"
  # Assert: Returns cz and sk rows
  ```

  **Commit**: YES
  - Message: `feat(db): add osm_data_sources table for OSM import tracking`
  - Files: `packages/common/src/osm/ids.ts`, `packages/common/src/index.ts`, `packages/db/src/schema.ts`
  - Pre-commit: `bun run check`

---

### Phase 4: Python API Admin Routes

- [ ] 4. Create Python API admin routes for OSM import

  **What to do**:
  - Add `DATABASE_URL` environment variable handling
  - Create `app/db.py` for PostgreSQL connection (psycopg2)
  - Create `app/routes/admin.py` with admin routes
  - Create `app/osm_import.py` with import job logic
  - Implement download → osm2pgsql pipeline (skip osmium conversion - direct PBF import)
  - Update status and progress in database throughout

  **Must NOT do**:
  - Add authentication (TRPC handles auth, Python just executes)
  - Allow concurrent imports for same region
  - Implement WebSocket progress (polling only)
  - Keep PBF files after import

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex multi-step background job with external tools
  - **Skills**: []
    - Python development

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `apps/api/app/job_queue.py:36-66` - add_job pattern
  - `apps/api/app/job_queue.py:99-129` - \_render_poster_sync pattern
  - `apps/api/app/routes/generate.py` - Existing route pattern

  **Route Structure**:

  ```python
  # app/routes/admin.py

  @router.get("/api/admin/osm/sources")
  async def list_sources():
      """List all OSM data sources with status."""
      return sources

  @router.post("/api/admin/osm/import/{source_code}")
  async def start_import(source_code: str):
      """Trigger import for a source (cz or sk)."""
      return {"message": "Import started", "source_code": source_code}

  @router.get("/api/admin/osm/status/{source_code}")
  async def get_import_status(source_code: str):
      """Get current import status for a source."""
      return {"status": ..., "progress": ..., "error": ...}
  ```

  **Import Pipeline** (osm_import.py):

  ```
  1. Update status: "downloading" (progress: 0-50%)
  2. Download PBF from Geofabrik to /tmp
  3. Update status: "importing" (progress: 50-100%)
  4. Run osm2pgsql to import PBF directly to PostGIS
  5. Create spatial indexes (GIST)
  6. Update status: "completed", set last_imported_at
  7. Delete temporary PBF file

  On error: Update status: "failed", set error_message
  ```

  **Acceptance Criteria**:

  ```bash
  # 1. Test list sources endpoint
  curl -s http://localhost:8000/api/admin/osm/sources | jq '.[] | {code, status}'
  # Assert: Returns [{code: "cz", status: "pending"}, {code: "sk", status: "pending"}]

  # 2. Test start import
  curl -s -X POST http://localhost:8000/api/admin/osm/import/cz | jq
  # Assert: Returns {"message": "Import started", "source_code": "cz"}

  # 3. Test status endpoint
  curl -s http://localhost:8000/api/admin/osm/status/cz | jq
  # Assert: Returns {"status": ..., "progress": ...}

  # 4. Verify status updates in database
  docker compose exec db psql -U postgres -d map_poster -c "SELECT code, status, progress FROM osm_data_sources WHERE code = 'cz';"
  # Assert: Shows current status

  # 5. Run unit tests
  cd apps/api && uv run pytest tests/test_admin.py -v
  # Assert: All tests pass
  ```

  **Commit**: YES
  - Message: `feat(api): add admin routes for OSM data import`
  - Files: `apps/api/app/routes/admin.py`, `apps/api/app/osm_import.py`, `apps/api/app/db.py`, `apps/api/app/main.py`, `apps/api/tests/test_admin.py`
  - Pre-commit: `cd apps/api && uv run pytest`

---

### Phase 5: TRPC Admin Router

- [ ] 5. Create TRPC admin router for OSM data management

  **What to do**:
  - Create `apps/web-app/src/admin/trpc/osm-data.ts` router
  - Add `list` query - returns all sources with status
  - Add `startImport` mutation - triggers Python API import
  - Add `getStatus` query - returns status for polling
  - Add router to `apps/web-app/src/infrastructure/trpc/router/index.ts`
  - Use `adminProcedure` for all endpoints

  **Must NOT do**:
  - Add WebSocket subscriptions
  - Bypass Python API (all imports go through Python)
  - Add endpoints for regions beyond CZ/SK

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard TRPC router following established patterns
  - **Skills**: [`trpc-patterns`]
    - `trpc-patterns`: TRPC router creation patterns specific to this codebase

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 4)
  - **Blocks**: Task 7
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `apps/web-app/src/map-poster/trpc/router.ts` - Long-running job pattern
  - `apps/web-app/src/admin/trpc/admin.ts:32-84` - Admin query patterns
  - `apps/web-app/src/infrastructure/trpc/procedures/auth.ts:48-51` - adminProcedure definition

  **Router Structure**:

  ```typescript
  // apps/web-app/src/admin/trpc/osm-data.ts
  import { adminProcedure } from "@/infrastructure/trpc/procedures/auth";
  import { osmDataSourcesTable } from "@map-poster/db";
  import { Schema } from "effect";
  import { env } from "@/env";

  export const router = {
    list: adminProcedure.query(async ({ ctx: { db } }) => {
      const sources = await db.select().from(osmDataSourcesTable);
      return sources;
    }),

    startImport: adminProcedure
      .input(
        Schema.standardSchemaV1(
          Schema.Struct({
            sourceCode: Schema.Literal("cz", "sk"),
          }),
        ),
      )
      .mutation(async ({ input }) => {
        const response = await fetch(
          `${env.MAP_POSTER_API_URL}/api/admin/osm/import/${input.sourceCode}`,
          { method: "POST" },
        );
        if (!response.ok) throw new Error("Import failed to start");
        return { success: true, sourceCode: input.sourceCode };
      }),

    getStatus: adminProcedure
      .input(
        Schema.standardSchemaV1(
          Schema.Struct({
            sourceCode: Schema.Literal("cz", "sk"),
          }),
        ),
      )
      .query(async ({ ctx: { db }, input }) => {
        const source = await db
          .select()
          .from(osmDataSourcesTable)
          .where(eq(osmDataSourcesTable.code, input.sourceCode))
          .limit(1);
        if (!source[0]) throw notFoundError("Source not found");
        return source[0];
      }),
  } satisfies TRPCRouterRecord;
  ```

  **Acceptance Criteria**:

  ```bash
  # 1. Verify TypeScript compiles
  bun run check
  # Assert: No errors

  # 2. Test list endpoint (requires admin auth)
  curl -s 'http://localhost:3000/api/trpc/admin.osmData.list' \
    -H "Cookie: <admin-session-cookie>" | jq '.result.data'
  # Assert: Returns array with cz and sk sources

  # 3. Test startImport mutation
  curl -s 'http://localhost:3000/api/trpc/admin.osmData.startImport' \
    -H "Cookie: <admin-session-cookie>" \
    -H "Content-Type: application/json" \
    -d '{"json":{"sourceCode":"cz"}}' | jq
  # Assert: Returns success

  # 4. Verify non-admin access denied
  curl -s 'http://localhost:3000/api/trpc/admin.osmData.list' | jq '.error.data.code'
  # Assert: Returns "UNAUTHORIZED"
  ```

  **Commit**: YES
  - Message: `feat(trpc): add admin.osmData router for OSM import management`
  - Files: `apps/web-app/src/admin/trpc/osm-data.ts`, `apps/web-app/src/infrastructure/trpc/router/index.ts`
  - Pre-commit: `bun run check`

---

### Phase 6: PostGIS Integration

- [ ] 6. Replace poster_service.py OSM fetching with PostGIS queries

  **What to do**:
  - Add `fetch_graph_postgis()` function querying `planet_osm_line` for roads
  - Add `fetch_features_postgis()` function querying `planet_osm_polygon` for water/parks
  - Add `is_location_available()` function to check if coordinates are in imported region
  - Modify `create_poster()` to use PostGIS functions
  - Keep file-based cache as secondary layer
  - Remove rate limiting delays (no longer needed)

  **Must NOT do**:
  - Remove existing Overpass functions (keep for reference)
  - Add fallback to Overpass if PostGIS fails
  - Change the poster rendering logic

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core business logic modification requiring careful testing
  - **Skills**: []
    - Python/geopandas work

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after Wave 3)
  - **Blocks**: Tasks 7, 8
  - **Blocked By**: Tasks 1, 4

  **References**:

  **Pattern References**:
  - `apps/api/app/poster_service.py:228-260` - fetch_graph function to replace
  - `apps/api/app/poster_service.py:263-294` - fetch_features function to replace

  **PostGIS Query Patterns**:

  ```sql
  -- Roads in bounding box
  SELECT osm_id, highway, name, way
  FROM planet_osm_line
  WHERE highway IS NOT NULL
  AND way && ST_Transform(ST_MakeEnvelope(:lon1, :lat1, :lon2, :lat2, 4326), 3857);

  -- Water features
  SELECT osm_id, "natural", waterway, way
  FROM planet_osm_polygon
  WHERE ("natural" IN ('water', 'bay', 'strait') OR waterway = 'riverbank')
  AND way && ST_Transform(ST_MakeEnvelope(:lon1, :lat1, :lon2, :lat2, 4326), 3857);

  -- Parks
  SELECT osm_id, leisure, landuse, way
  FROM planet_osm_polygon
  WHERE (leisure = 'park' OR landuse = 'grass')
  AND way && ST_Transform(ST_MakeEnvelope(:lon1, :lat1, :lon2, :lat2, 4326), 3857);
  ```

  **Acceptance Criteria**:

  ```bash
  # 1. Test poster generation timing with PostGIS (after import)
  time curl -s -X POST http://localhost:8000/api/generate -H "Content-Type: application/json" \
    -d '{"lat": 50.0755, "lon": 14.4378, "theme": "noir", "distance": 1500, "city": "Praha", "country": "Czech Republic"}' | jq '.job_id'
  # Assert: Returns job_id, completes in <10 seconds

  # 2. Test error for unimported region
  curl -s -X POST http://localhost:8000/api/generate -H "Content-Type: application/json" \
    -d '{"lat": 52.52, "lon": 13.405, "theme": "noir", "distance": 1500, "city": "Berlin", "country": "Germany"}' | jq
  # Assert: Returns error about region not available

  # 3. Run unit tests
  cd apps/api && uv run pytest tests/test_poster_postgis.py -v
  # Assert: All tests pass
  ```

  **Commit**: YES
  - Message: `feat(api): replace Overpass API with PostGIS queries for OSM data`
  - Files: `apps/api/app/poster_service.py`, `apps/api/tests/test_poster_postgis.py`
  - Pre-commit: `cd apps/api && uv run pytest`

---

### Phase 7: Admin UI

- [ ] 7. Create admin UI page for OSM data management

  **What to do**:
  - Create route `apps/web-app/src/routes/app/admin/osm-data.tsx`
  - Add navigation item to sidebar for admin section
  - Display status cards for CZ and SK sources
  - Show progress bar during import
  - Add "Import" / "Update" button for each source
  - Poll status every 5 seconds during active import
  - Show last imported timestamp
  - Show error message if import failed

  **Must NOT do**:
  - Add forms for custom regions
  - Add WebSocket connections
  - Show detailed logs (just status + progress)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI page creation with status displays and progress bars
  - **Skills**: [`tanstack-frontend`, `frontend-design`]
    - `tanstack-frontend`: Route creation, loader patterns, query/mutation patterns
    - `frontend-design`: UI components, status cards, progress bars, styling

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after Task 6)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 5, 6

  **References**:

  **Pattern References**:
  - `apps/web-app/src/routes/app/admin/users.tsx` - Admin page pattern with loader prefetch
  - `apps/web-app/src/routes/app/admin/observability.tsx` - Admin page with status cards
  - `apps/web-app/src/routes/app/admin/index.tsx` - Admin dashboard card navigation

  **Component References**:
  - `apps/web-app/src/shared/ui/stat-card.tsx` - StatCard component
  - `apps/web-app/src/shared/ui/badge.tsx` - Status badge component

  **Acceptance Criteria**:

  Using Playwright browser automation:

  ```
  # 1. Navigate to admin OSM data page
  1. Navigate to: http://localhost:3000/app/admin/osm-data (as admin user)
  2. Wait for: "OSM Data Sources" heading visible
  3. Assert: Two cards visible (Czech Republic, Slovakia)
  4. Screenshot: .sisyphus/evidence/osm-admin-initial.png

  # 2. Verify status badges
  1. Assert: Each card has status badge
  2. Assert: Badge color matches status

  # 3. Test import button
  1. Click: "Import" button on Czech Republic card
  2. Wait for: Progress bar OR status change
  3. Assert: Button becomes disabled during import
  4. Screenshot: .sisyphus/evidence/osm-admin-importing.png

  # 4. Verify non-admin access
  1. Log out and log in as non-admin
  2. Navigate to: http://localhost:3000/app/admin/osm-data
  3. Assert: Redirected to dashboard
  ```

  **Commit**: YES
  - Message: `feat(ui): add admin page for OSM data source management`
  - Files: `apps/web-app/src/routes/app/admin/osm-data.tsx`, `apps/web-app/src/shared/sidebar/index.tsx`
  - Pre-commit: `bun run check`

---

### Phase 8: Testing & Documentation

- [ ] 8. Final testing and documentation

  **What to do**:
  - Run full E2E test of import flow
  - Verify production deployment on Coolify
  - Update API documentation
  - Add troubleshooting guide for common issues
  - Document server upgrade requirements for OSM import

  **Must NOT do**:
  - Skip production verification
  - Leave undocumented edge cases

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Documentation and verification
  - **Skills**: []
    - Standard documentation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final (after Task 7)
  - **Blocks**: None
  - **Blocked By**: Task 7

  **References**:
  - `apps/api/README.md` - API documentation

  **Documentation to Add**:

  ```markdown
  ## OSM Data Import

  ### Server Requirements

  - **RAM**: 4-8GB recommended (OSM import temporarily needs 2-4GB)
  - **Disk**: 10GB+ free (CZ ~2GB, SK ~1GB after import)

  ### Triggering Import

  1. Go to Admin → OSM Data Sources
  2. Click "Import" on desired region
  3. Wait for completion (30-60 minutes for full region)

  ### Troubleshooting

  - **Import fails with OOM**: Upgrade server RAM to 8GB
  - **Slow poster generation**: Verify PostGIS spatial indexes exist
  - **Location not available**: Check if coordinates are within CZ/SK boundaries
  ```

  **Acceptance Criteria**:

  ```bash
  # 1. Verify production deployment
  curl -s https://<production-domain>/api/health | jq
  # Assert: Returns {"status": "ok"}

  # 2. Verify PostGIS on production
  # Via Coolify terminal:
  psql $DATABASE_URL -c "SELECT PostGIS_Version();"
  # Assert: Returns version

  # 3. Documentation updated
  grep -i "osm" apps/api/README.md
  # Assert: OSM import documentation present

  # 4. All tests pass
  bun run check
  bun run test
  cd apps/api && uv run pytest
  # Assert: All pass
  ```

  **Commit**: YES
  - Message: `docs: add OSM import documentation and troubleshooting guide`
  - Files: `apps/api/README.md`, `docs/deployment.md`
  - Pre-commit: `bun run check`

---

## Commit Strategy

**RULE: Maximum 2-3 commits per plan. Group related work.**

| Commit | Contains                 | Tasks                 | Message                                                                                          |
| ------ | ------------------------ | --------------------- | ------------------------------------------------------------------------------------------------ |
| **1**  | Infrastructure migration | 0.1, 0.2, 0.3, 0.4, 2 | `feat(infra): migrate from Kubernetes to Coolify with Docker Compose, add PostGIS and OSM tools` |
| **2**  | Feature implementation   | 3, 4, 5, 6, 7         | `feat(osm): add offline OSM data support with PostGIS queries, admin import UI, and TRPC router` |
| **3**  | Documentation (optional) | 8                     | `docs: add OSM import documentation and troubleshooting guide`                                   |

**Files per commit:**

**Commit 1 (Infrastructure):**

- `docker-compose.yml`, `docker-compose.prod.yml`
- `kubernetes/` (deleted)
- `docs/deployment.md`
- `CLAUDE.md`, `README.md`
- `apps/api/Dockerfile`, `apps/api/pyproject.toml`

**Commit 2 (Feature):**

- `packages/common/src/osm/*`
- `packages/db/src/schema.ts`
- `apps/api/app/routes/admin.py`, `apps/api/app/osm_import.py`, `apps/api/app/db.py`
- `apps/api/app/poster_service.py`
- `apps/web-app/src/admin/trpc/osm-data.ts`
- `apps/web-app/src/routes/app/admin/osm-data.tsx`
- Test files

**Commit 3 (Docs - optional):**

- `apps/api/README.md`
- `docs/deployment.md` updates

---

## Success Criteria

### Verification Commands

```bash
# 1. Local development works
docker compose up -d && curl -s http://localhost:3000 | head -1
# Expected: HTML response

# 2. Kubernetes files removed
ls kubernetes/ 2>&1
# Expected: "No such file or directory"

# 3. PostGIS available
docker compose exec db psql -U postgres -c "SELECT PostGIS_Version();"
# Expected: "3.4..."

# 4. Production accessible (after Coolify deployment)
curl -s https://<production-domain>/api/health
# Expected: {"status": "ok"}

# 5. OSM import works (after triggering)
docker compose exec db psql -U postgres -d map_poster -c "SELECT code, status FROM osm_data_sources WHERE status = 'completed';"
# Expected: At least one row

# 6. Poster generation speed
time curl -s -X POST http://localhost:8000/api/generate -d '{"lat":50.0755,"lon":14.4378,"theme":"noir","distance":1500}'
# Expected: <10 seconds (vs 30+ with Overpass)

# 7. All tests pass
bun run check && bun run test
# Expected: No errors
```

### Final Checklist

- [ ] Docker Compose files created and working
- [ ] Kubernetes directory deleted
- [ ] CLAUDE.md updated (no K8s references)
- [ ] App deployed to Coolify
- [ ] PostGIS running via postgis/postgis:18-3.6 image
- [ ] osm_data_sources table created with CZ/SK rows
- [ ] Admin can trigger import from UI
- [ ] Import progress visible (polling)
- [ ] Poster generation uses PostGIS (<10s vs 30s+)
- [ ] Error shown for unimported regions
- [ ] All unit tests pass
- [ ] bun run check passes
