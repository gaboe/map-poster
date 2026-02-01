# Map Poster Landing Page

## TL;DR

> **Quick Summary**: Build a public landing page that generates beautiful map poster previews using browser geolocation (with IP fallback). Python FastAPI backend wraps maptoposter CLI logic, tRPC provides type-safe frontend integration.
> 
> **Deliverables**:
> - Python FastAPI service at `apps/api/`
> - tRPC `mapPoster` router with generate/status endpoints
> - Landing page at `/_web/poster/` with location search + theme selector
> - Dockerfile for K8s deployment
> - README with setup instructions
> 
> **Estimated Effort**: Large (5-7 days)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 4 → Task 6 → Task 8

---

## Context

### Original Request
Build a web app "map poster generator" landing page that:
1. Requests browser geolocation on page load
2. Generates beautiful map poster preview based on user's location  
3. Allows changing location via search input and selecting map style/theme

### Interview Summary
**Key Discussions**:
- Architecture: TanStack Start → tRPC → Python FastAPI → OSM → PNG
- Source: maptoposter is CLI tool (NOT an API) - needs FastAPI wrapper built from scratch
- Async pattern: POST /generate → job_id → poll status → get image URL
- 17 JSON themes available (noir, midnight_blue, terracotta, etc.)

**Research Findings**:
- maptoposter: 593 lines Python CLI with osmnx, matplotlib, geopandas
- Web-app: 52 shadcn components, _web/ route pattern, publicProcedure for unauthenticated
- FastAPI: asyncio.Queue + ThreadPoolExecutor for job management

**User Decisions**:
- Test Strategy: TDD for Python API (pytest)
- Location Fallback: IP-based geolocation via ip-api.com (free)
- Preview Quality: 150 DPI for speed (~5-15s generation)

### Metis Review
**Identified Gaps** (addressed):
- Rate limiting: Added IP-based rate limiting (10 req/min) to prevent abuse
- Job cleanup: Added stale job expiration (30 min TTL)
- Cache limits: Documented K8s ephemeral storage limitation
- Edge cases: Added validation for coordinates, ocean locations, Unicode cities

---

## Work Objectives

### Core Objective
Build a public, unauthenticated landing page where users can instantly preview custom map posters for any location, with theme selection and fast generation.

### Concrete Deliverables
- `apps/api/` - Python FastAPI service
- `apps/web-app/src/map-poster/trpc/` - tRPC router
- `apps/web-app/src/routes/_web/poster/` - Landing page route
- `apps/api/Dockerfile` - Production container
- `apps/api/README.md` - Setup documentation

### Definition of Done
- [x] `curl http://localhost:8000/api/health` returns `{"status": "ok"}`
- [x] `curl http://localhost:8000/api/themes | jq length` returns `17`
- [x] Generate job completes within 30s and returns valid PNG URL
- [x] Landing page loads at `/poster` without authentication
- [x] Geolocation fallback chain works: browser → IP → Prague default
- [x] Theme change triggers new preview generation
- [x] Cache hit on second request with same params
- [x] Logging shows cache hit/miss and generation timing

### Must Have
- Browser geolocation with IP fallback
- 17 theme options from maptoposter source
- Loading skeleton during generation
- Error handling for network/API failures
- Health check endpoint for K8s

### Must NOT Have (Guardrails)
- User authentication or accounts
- High-resolution export (300 DPI) - preview only (150 DPI)
- Custom theme editor - use 17 fixed themes
- Save/download functionality
- Social sharing features
- WebSocket real-time progress - polling only
- Payment/monetization
- Print ordering

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (bun test for TS, pytest for Python)
- **User wants tests**: YES - TDD for Python API
- **Framework**: pytest for Python, bun test for tRPC

### TDD Approach (Python API)

Each Python task follows RED-GREEN-REFACTOR:

**Task Structure:**
1. **RED**: Write failing test first
   - Test file: `tests/test_*.py`
   - Test command: `uv run pytest tests/`
   - Expected: FAIL (test exists, implementation doesn't)
2. **GREEN**: Implement minimum code to pass
   - Command: `uv run pytest tests/`
   - Expected: PASS
3. **REFACTOR**: Clean up while keeping green
   - Command: `uv run pytest tests/`
   - Expected: PASS (still)

### Automated Verification (Frontend/tRPC)

UI verification via Playwright browser automation (see individual task criteria).

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Python API project setup + health endpoint
├── Task 2: Copy themes from maptoposter source
└── Task 3: tRPC router skeleton

Wave 2 (After Wave 1):
├── Task 4: Generation endpoint with job queue [depends: 1, 2]
├── Task 5: Status polling endpoint [depends: 1]
└── Task 6: tRPC integration with Python API [depends: 3, 4, 5]

Wave 3 (After Wave 2):
├── Task 7: Landing page UI [depends: 6]
├── Task 8: Geolocation with IP fallback [depends: 7]
└── Task 9: Dockerfile + README [depends: 4]

Final:
└── Task 10: Integration testing [depends: all]
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4, 5, 9 | 2, 3 |
| 2 | None | 4 | 1, 3 |
| 3 | None | 6 | 1, 2 |
| 4 | 1, 2 | 6, 9 | 5 |
| 5 | 1 | 6 | 4 |
| 6 | 3, 4, 5 | 7 | None |
| 7 | 6 | 8, 10 | 9 |
| 8 | 7 | 10 | 9 |
| 9 | 4 | 10 | 7, 8 |
| 10 | 7, 8, 9 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Dispatch |
|------|-------|---------------------|
| 1 | 1, 2, 3 | 3 parallel agents (quick category for each) |
| 2 | 4, 5, 6 | Sequential within wave (dependencies) |
| 3 | 7, 8, 9 | 7→8 sequential, 9 parallel with 7 |
| Final | 10 | Single integration task |

---

## TODOs

---

- [x] 1. Python API Project Setup + Health Endpoint (TDD)

  **What to do**:
  - Create `apps/api/` directory structure
  - Initialize with `uv init` and create pyproject.toml
  - Add FastAPI, uvicorn, pydantic dependencies
  - Write failing test for `/api/health` endpoint
  - Implement health endpoint to pass test
  - Add basic logging setup

  **Must NOT do**:
  - Don't add authentication
  - Don't use pip/poetry - use uv only
  - Don't add database dependencies

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple project scaffold with one endpoint
  - **Skills**: `[]`
    - No project-specific skills needed for Python setup

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 9
  - **Blocked By**: None (can start immediately)

  **References**:
  
  **Pattern References**:
  - `opensrc/repos/github.com/originalankur/maptoposter/pyproject.toml` - Python project structure with uv
  - `opensrc/repos/github.com/originalankur/maptoposter/requirements.txt` - Required dependencies list

  **External References**:
  - FastAPI health check patterns from Metis research (use lifespan context manager)

  **WHY Each Reference Matters**:
  - pyproject.toml shows uv-compatible project setup
  - requirements.txt has exact dependency versions that work together

  **Acceptance Criteria**:

  **TDD (pytest):**
  - [ ] Test file created: `apps/api/tests/test_health.py`
  - [ ] Test covers: GET /api/health returns 200 with status "ok"
  - [ ] `cd apps/api && uv run pytest` → PASS

  **Automated Verification:**
  ```bash
  # Start server
  cd apps/api && uv run uvicorn app.main:app --port 8000 &
  sleep 3
  
  # Health check
  curl -s http://localhost:8000/api/health | jq '.status'
  # Assert: "ok"
  
  # Cleanup
  pkill -f "uvicorn app.main:app"
  ```

  **Commit**: YES
  - Message: `feat(map-poster-api): initialize Python FastAPI project with health endpoint`
  - Files: `apps/api/**`
  - Pre-commit: `cd apps/api && uv run pytest`

---

- [x] 2. Copy Themes from maptoposter Source

  **What to do**:
  - Create `apps/api/themes/` directory
  - Copy all 17 JSON theme files from `opensrc/repos/github.com/originalankur/maptoposter/themes/`
  - Create `app/themes.py` module with `load_theme()` and `list_themes()` functions
  - Write tests for theme loading
  - Implement `/api/themes` endpoint

  **Must NOT do**:
  - Don't modify theme JSON structure
  - Don't create theme editor functionality
  - Don't add new themes

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: File copy + simple loader implementation
  - **Skills**: `[]`
    - No project-specific skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 4
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `opensrc/repos/github.com/originalankur/maptoposter/themes/*.json` - All 17 theme files to copy
  - `opensrc/repos/github.com/originalankur/maptoposter/create_map_poster.py:177-207` - load_theme() function implementation

  **WHY Each Reference Matters**:
  - Theme JSONs are the exact files to copy (17 themes with consistent structure)
  - load_theme() shows fallback handling and structure validation

  **Acceptance Criteria**:

  **TDD (pytest):**
  - [ ] Test file created: `apps/api/tests/test_themes.py`
  - [ ] Test covers: list_themes() returns 17 themes
  - [ ] Test covers: load_theme("noir") returns valid theme dict
  - [ ] Test covers: load_theme("nonexistent") returns fallback theme
  - [ ] `cd apps/api && uv run pytest tests/test_themes.py` → PASS

  **Automated Verification:**
  ```bash
  # List themes endpoint
  curl -s http://localhost:8000/api/themes | jq 'length'
  # Assert: 17
  
  # Theme structure
  curl -s http://localhost:8000/api/themes | jq '.[0] | keys'
  # Assert: Contains "id", "name", "description"
  ```

  **Commit**: YES
  - Message: `feat(map-poster-api): add 17 themes from maptoposter source`
  - Files: `apps/api/themes/`, `apps/api/app/themes.py`
  - Pre-commit: `cd apps/api && uv run pytest tests/test_themes.py`

---

- [x] 3. tRPC Router Skeleton

  **What to do**:
  - Create `apps/web-app/src/map-poster/` feature directory
  - Create `trpc/router.ts` with mapPoster router
  - Add placeholder procedures: `generatePreview` mutation, `getStatus` query, `listThemes` query
  - Register router in main `router/index.ts`
  - Add to RouterInputs/RouterOutputs exports

  **Must NOT do**:
  - Don't implement actual Python API calls yet (placeholder only)
  - Don't add authentication (use publicProcedure)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple router scaffold following existing patterns
  - **Skills**: `["trpc-patterns"]`
    - trpc-patterns: Needed for procedure patterns and error handling

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 6
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `apps/web-app/src/contact/trpc/router.ts` - External API call pattern with fetch
  - `apps/web-app/src/infrastructure/trpc/router/index.ts` - Router registration pattern
  - `apps/web-app/src/infrastructure/trpc/procedures/auth.ts` - publicProcedure definition

  **API/Type References**:
  - `apps/web-app/src/infrastructure/errors.ts` - Error helpers (badRequestError, internalServerError)

  **WHY Each Reference Matters**:
  - contact/router.ts shows exact pattern for calling external APIs from tRPC
  - router/index.ts shows how to register new router
  - publicProcedure is the base for unauthenticated endpoints

  **Acceptance Criteria**:

  **Automated Verification:**
  ```bash
  # TypeScript compiles
  cd apps/web-app && bun run typecheck
  # Assert: No errors
  
  # Router registered (grep check)
  grep -q "mapPoster" apps/web-app/src/infrastructure/trpc/router/index.ts
  # Assert: Found
  ```

  **Commit**: YES
  - Message: `feat(web-app): add mapPoster tRPC router skeleton`
  - Files: `apps/web-app/src/map-poster/`, `apps/web-app/src/infrastructure/trpc/router/index.ts`
  - Pre-commit: `cd apps/web-app && bun run typecheck`

---

- [x] 4. Generation Endpoint with Job Queue (TDD)

  **What to do**:
  - Port `create_map_poster.py` core logic to `app/poster_service.py`
  - Implement asyncio.Queue + ThreadPoolExecutor job management
  - Create `/api/generate` POST endpoint (returns job_id)
  - Add rate limiting: 10 requests/minute per IP
  - Add job TTL: 30 minutes expiration
  - Implement file-based cache with hash key (lat, lon, zoom, theme)
  - Copy fonts from maptoposter source

  **Must NOT do**:
  - Don't use Redis/Celery (in-memory queue only)
  - Don't add 300 DPI option (150 DPI only)
  - Don't add database persistence

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex task porting Python logic with job queue
  - **Skills**: `[]`
    - No project-specific skills (Python FastAPI work)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential)
  - **Blocks**: Tasks 6, 9
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `opensrc/repos/github.com/originalankur/maptoposter/create_map_poster.py:319-360` - get_coordinates() geocoding
  - `opensrc/repos/github.com/originalankur/maptoposter/create_map_poster.py:409-441` - fetch_graph() OSM network
  - `opensrc/repos/github.com/originalankur/maptoposter/create_map_poster.py:444-479` - fetch_features() water/parks
  - `opensrc/repos/github.com/originalankur/maptoposter/create_map_poster.py:482-700` - create_poster() rendering
  - `opensrc/repos/github.com/originalankur/maptoposter/create_map_poster.py:53-108` - cache_get/cache_set

  **External References**:
  - FastAPI BackgroundTasks + asyncio.Queue pattern from Metis research

  **WHY Each Reference Matters**:
  - These are the exact functions to port, preserving the rendering logic
  - Cache functions show the pickle-based caching to replicate

  **Acceptance Criteria**:

  **TDD (pytest):**
  - [ ] Test file: `apps/api/tests/test_generate.py`
  - [ ] Test: POST /api/generate returns job_id
  - [ ] Test: Invalid coordinates (lat=999) returns 400
  - [ ] Test: Rate limit exceeded returns 429
  - [ ] Test: Job queue accepts and processes jobs
  - [ ] `uv run pytest tests/test_generate.py` → PASS

  **Automated Verification:**
  ```bash
  # Submit generation job
  JOB_ID=$(curl -s -X POST http://localhost:8000/api/generate \
    -H "Content-Type: application/json" \
    -d '{"lat": 50.0755, "lon": 14.4378, "theme": "noir"}' | jq -r '.job_id')
  echo "Job ID: $JOB_ID"
  # Assert: JOB_ID is non-empty UUID
  
  # Invalid coordinates rejected
  curl -s -X POST http://localhost:8000/api/generate \
    -H "Content-Type: application/json" \
    -d '{"lat": 999, "lon": 999, "theme": "noir"}' | jq '.detail'
  # Assert: Contains "Invalid coordinates"
  ```

  **Commit**: YES
  - Message: `feat(map-poster-api): implement poster generation with job queue`
  - Files: `apps/api/app/poster_service.py`, `apps/api/app/routes/generate.py`
  - Pre-commit: `uv run pytest tests/test_generate.py`

---

- [x] 5. Status Polling Endpoint (TDD)

  **What to do**:
  - Implement `/api/status/{job_id}` GET endpoint
  - Return job status: queued, processing, completed, failed
  - Include progress percentage (0-100)
  - Return image URL when completed
  - Mount `/cache` directory as static files for image serving

  **Must NOT do**:
  - Don't add WebSocket (polling only)
  - Don't persist job history to database

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple endpoint reading from job store
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - FastAPI StaticFiles pattern from Metis research
  - Job status response schema from Metis research

  **Acceptance Criteria**:

  **TDD (pytest):**
  - [ ] Test file: `apps/api/tests/test_status.py`
  - [ ] Test: Unknown job_id returns 404
  - [ ] Test: Completed job returns url field
  - [ ] Test: Progress is 0-100 integer
  - [ ] `uv run pytest tests/test_status.py` → PASS

  **Automated Verification:**
  ```bash
  # Poll for completion (after job from Task 4)
  for i in {1..30}; do
    RESP=$(curl -s "http://localhost:8000/api/status/$JOB_ID")
    STATUS=$(echo $RESP | jq -r '.status')
    PROGRESS=$(echo $RESP | jq -r '.progress')
    echo "Status: $STATUS, Progress: $PROGRESS%"
    if [ "$STATUS" = "completed" ]; then break; fi
    sleep 1
  done
  # Assert: STATUS = "completed"
  
  # Verify image accessible
  URL=$(curl -s "http://localhost:8000/api/status/$JOB_ID" | jq -r '.url')
  curl -s -o /dev/null -w "%{http_code}" "$URL"
  # Assert: 200
  ```

  **Commit**: YES
  - Message: `feat(map-poster-api): add status polling endpoint with static file serving`
  - Files: `apps/api/app/routes/status.py`
  - Pre-commit: `uv run pytest tests/test_status.py`

---

- [x] 6. tRPC Integration with Python API

  **What to do**:
  - Implement `generatePreview` mutation calling Python `/api/generate`
  - Implement `getStatus` query calling Python `/api/status/{job_id}`
  - Implement `listThemes` query calling Python `/api/themes`
  - Add environment variable for Python API URL
  - Map Python API errors to tRPC errors

  **Must NOT do**:
  - Don't add caching in tRPC layer (Python handles it)
  - Don't add authentication

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Following established external API pattern
  - **Skills**: `["trpc-patterns"]`
    - trpc-patterns: Error mapping and procedure patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 3, 4, 5

  **References**:

  **Pattern References**:
  - `apps/web-app/src/contact/trpc/router.ts:67-101` - External fetch with error handling
  - `apps/web-app/src/infrastructure/errors.ts` - badRequestError, internalServerError helpers
  - `apps/web-app/src/env/server.ts` - Environment variable pattern

  **WHY Each Reference Matters**:
  - contact/router.ts shows exact pattern: fetch → check response → throw TRPCError
  - errors.ts has pre-built error helpers
  - server.ts shows how to add new environment variables

  **Acceptance Criteria**:

  **Automated Verification:**
  ```bash
  # tRPC listThemes
  curl -s "http://localhost:3000/api/trpc/mapPoster.listThemes" | jq '.result.data | length'
  # Assert: 17
  
  # tRPC generatePreview
  curl -s http://localhost:3000/api/trpc/mapPoster.generatePreview \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"json":{"lat":50.0755,"lon":14.4378,"theme":"noir"}}' | jq '.result.data.jobId'
  # Assert: Non-empty string
  ```

  **Commit**: YES
  - Message: `feat(web-app): integrate tRPC mapPoster router with Python API`
  - Files: `apps/web-app/src/map-poster/trpc/router.ts`, `apps/web-app/src/env/server.ts`
  - Pre-commit: `bun run typecheck`

---

- [x] 7. Landing Page UI

  **What to do**:
  - Create `apps/web-app/src/routes/_web/poster/index.tsx`
  - Create `apps/web-app/src/routes/_web/poster/route.tsx` with WebLayout
  - Build layout: large map preview (center), controls panel (right)
  - Use shadcn components: Card, Select, Input, Button, Skeleton
  - Add loading skeleton for 5-15s generation wait
  - Add SEO metadata in head() function

  **Must NOT do**:
  - Don't add download/save buttons
  - Don't add user accounts
  - Don't add shopping cart
  - Don't make mobile-first (desktop focus for MVP)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI layout with design considerations
  - **Skills**: `["tanstack-frontend", "frontend-ui-ux"]`
    - tanstack-frontend: Route patterns and query integration
    - frontend-ui-ux: Layout and UX considerations

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 8, 10
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `apps/web-app/src/routes/_web/contact.tsx` - Public route structure with WebLayout
  - `apps/web-app/src/routes/_web/route.tsx` - WebLayout wrapper pattern
  - `apps/web-app/src/shared/ui/skeleton.tsx` - Loading skeleton component
  - `apps/web-app/src/shared/ui/select.tsx` - Select dropdown component

  **WHY Each Reference Matters**:
  - contact.tsx shows SEO metadata pattern and form handling
  - route.tsx shows how _web routes are wrapped
  - shadcn components are pre-styled and ready to use

  **Acceptance Criteria**:

  **Automated Verification (Playwright):**
  ```
  # Agent executes via playwright skill:
  1. Navigate to: http://localhost:3000/poster
  2. Assert: Page loads (HTTP 200)
  3. Assert: Select dropdown with "Theme" label exists
  4. Assert: Input with "Location" placeholder exists
  5. Assert: Skeleton or image container exists
  6. Screenshot: .sisyphus/evidence/task-7-landing-page.png
  ```

  **Commit**: YES
  - Message: `feat(web-app): add map poster landing page UI`
  - Files: `apps/web-app/src/routes/_web/poster/`
  - Pre-commit: `bun run typecheck`

---

- [x] 8. Geolocation with IP Fallback

  **What to do**:
  - Implement browser geolocation request on page load
  - Add IP-based fallback using ip-api.com (free, no API key)
  - Add Prague as final fallback if IP lookup fails
  - Create `useGeolocation` hook with status states
  - Trigger initial poster generation with detected location

  **Must NOT do**:
  - Don't store location history
  - Don't add location permission explanation modal

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Hook implementation with fallback chain
  - **Skills**: `["tanstack-frontend"]`
    - tanstack-frontend: React hooks and query patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after Task 7)
  - **Blocks**: Task 10
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - Browser Geolocation API: `navigator.geolocation.getCurrentPosition()`
  - ip-api.com: `http://ip-api.com/json/` (free, CORS enabled)

  **External References**:
  - ip-api.com docs: Returns `{lat, lon, city, country}` - perfect for our use case

  **Acceptance Criteria**:

  **Automated Verification (Playwright):**
  ```
  # Test with geolocation granted:
  1. Set geolocation permission: grant
  2. Set mock coordinates: lat=50.0755, lon=14.4378
  3. Navigate to: http://localhost:3000/poster
  4. Wait for: Location input to auto-fill
  5. Assert: Input contains location text (not empty)
  
  # Test with geolocation denied:
  1. Set geolocation permission: deny
  2. Navigate to: http://localhost:3000/poster
  3. Wait for: IP-based or default location
  4. Assert: Input contains location text (fallback worked)
  ```

  **Commit**: YES
  - Message: `feat(web-app): add geolocation with IP fallback chain`
  - Files: `apps/web-app/src/map-poster/hooks/use-geolocation.ts`
  - Pre-commit: `bun run typecheck`

---

- [x] 9. Dockerfile + README

  **What to do**:
  - Create `apps/api/Dockerfile` (multi-stage build)
  - Use Python 3.12 slim base image
  - Install uv and dependencies
  - Create non-root user for security
  - Write `apps/api/README.md` with:
    - Local development setup (uv)
    - Environment variables
    - Cache location and cleanup
    - API endpoint documentation

  **Must NOT do**:
  - Don't use Alpine (geopandas compilation issues)
  - Don't add docker-compose (K8s only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard Dockerfile + documentation
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8)
  - **Blocks**: Task 10
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - uv Docker pattern from official docs

  **Acceptance Criteria**:

  **Automated Verification:**
  ```bash
  # Docker build succeeds
  cd apps/api && docker build -t map-poster-api:test .
  # Assert: Exit code 0
  
  # Container runs
  docker run -d --name map-poster-test -p 8001:8000 map-poster-api:test
  sleep 5
  curl -s http://localhost:8001/api/health | jq '.status'
  # Assert: "ok"
  
  # Cleanup
  docker stop map-poster-test && docker rm map-poster-test
  
  # README exists
  test -f apps/api/README.md
  # Assert: File exists
  ```

  **Commit**: YES
  - Message: `feat(map-poster-api): add Dockerfile and README`
  - Files: `apps/api/Dockerfile`, `apps/api/README.md`
  - Pre-commit: `docker build -t map-poster-api:test apps/api/`

---

- [x] 10. Integration Testing

  **What to do**:
  - Full end-to-end flow: geolocation → generate → poll → display
  - Test theme switching triggers new generation
  - Test cache hit on second request
  - Verify error states display correctly
  - Add logging verification for cache hit/miss

  **Must NOT do**:
  - Don't add performance benchmarks (MVP only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Final verification of existing work
  - **Skills**: `["playwright", "testing-patterns"]`
    - playwright: Browser automation
    - testing-patterns: E2E test patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final (after all)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 7, 8, 9

  **References**:

  **Pattern References**:
  - `apps/web-app/e2e/*.e2e.ts` - Existing E2E test patterns

  **Acceptance Criteria**:

  **Automated Verification (Playwright):**
  ```
  # Full flow test:
  1. Navigate to: http://localhost:3000/poster
  2. Wait for: Initial preview to load (skeleton → image)
  3. Select: Theme "midnight_blue" from dropdown
  4. Wait for: New preview to generate
  5. Assert: Image source changed
  6. Screenshot: .sisyphus/evidence/task-10-full-flow.png
  
  # Verify logging:
  1. Check Python API logs for "cache hit" or "cache miss"
  2. Assert: Timing information present
  ```

  **Commit**: YES
  - Message: `test(web-app): add map poster E2E integration tests`
  - Files: `apps/web-app/e2e/map-poster.e2e.ts`
  - Pre-commit: `bun run test:e2e -- --grep "map poster"`

---

## Commit Strategy

| After Tasks | Message | Files | Verification |
|-------------|---------|-------|--------------|
| 1, 2 | `feat(map-poster-api): initialize Python API with themes` | apps/api/ | pytest |
| 3 | `feat(web-app): add mapPoster tRPC router skeleton` | apps/web-app/src/map-poster/ | typecheck |
| 4, 5 | `feat(map-poster-api): implement generation and status endpoints` | apps/api/app/ | pytest |
| 6 | `feat(web-app): integrate tRPC with Python API` | apps/web-app/src/map-poster/trpc/ | typecheck |
| 7, 8 | `feat(web-app): add map poster landing page with geolocation` | apps/web-app/src/routes/_web/poster/ | typecheck |
| 9, 10 | `feat(map-poster-api): add Dockerfile and complete testing` | multiple | docker build, e2e |

---

## Success Criteria

### Verification Commands
```bash
# Python API health
curl -s http://localhost:8000/api/health | jq '.status'
# Expected: "ok"

# Python API themes count
curl -s http://localhost:8000/api/themes | jq 'length'
# Expected: 17

# Full generation flow
JOB_ID=$(curl -s -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"lat": 50.0755, "lon": 14.4378, "theme": "noir"}' | jq -r '.job_id')
sleep 30
curl -s "http://localhost:8000/api/status/$JOB_ID" | jq '.status'
# Expected: "completed"

# Landing page accessible
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/poster
# Expected: 200
```

### Final Checklist
- [x] All "Must Have" features implemented
- [x] All "Must NOT Have" exclusions verified absent
- [x] Python pytest suite passes
- [x] TypeScript typecheck passes
- [x] Docker image builds successfully
- [x] README documentation complete
- [x] Logging shows cache hit/miss
