# Draft: Offline OpenStreetMap Data Support

## Requirements (confirmed from user request)

- **Goal**: Replace Overpass API with local PostGIS for 10-50x speedup
- **Target regions**: Czech Republic (~868MB PBF) and Slovakia (~281MB PBF)
- **Must support small villages**: Pre-caching top cities not sufficient
- **Admin control**: Manual trigger for download/update from admin panel

## Technical Decisions

### Database Pattern (from schema.ts analysis)
- Tables use `pgTable()` with `text("id").primaryKey().$defaultFn(() => createId())`
- Status fields use `.$type<StatusValue>()` for type safety
- Timestamps: `createdAt`, `updatedAt` patterns present
- Relations defined separately with `relations()` function

### TRPC Pattern (from admin.ts analysis)
- Admin router uses `adminProcedure` for protected endpoints
- Input validation with `Schema.standardSchemaV1(Schema.Struct({...}))`
- Error handling with `notFoundError()`, `forbiddenError()` helpers
- Pattern: queries return objects, mutations return `{ success: true, message: "..." }`

### Python API Pattern (from poster_service.py/job_queue.py)
- Background jobs via `asyncio.Queue` + `ThreadPoolExecutor`
- Jobs stored in-memory dict with TTL (30 min)
- Progress tracking: status, progress (0-100), url, error
- Current bottleneck: `fetch_graph()` and `fetch_features()` call Overpass API via osmnx

### Kubernetes Pattern (from values.test.yaml)
- Environment vars in `extraEnvVars` array
- Secrets via `secretKeyRef` to `web-app-secrets`
- Persistence via PVC with `azurefile` storageClass

## Research Findings

### Current OSM Data Flow
1. `poster_service.py` calls `ox.graph_from_point()` (street network)
2. Calls `ox.features_from_point()` for water and parks
3. Each call hits Overpass API with rate limiting delays (0.3-1s)
4. File-based pickle cache in `cache/` directory

### PostGIS Requirements
- `osm2pgsql` creates tables: `planet_osm_line`, `planet_osm_polygon`, `planet_osm_point`
- Spatial queries use `ST_MakeEnvelope()` with bbox
- GIST indexes for spatial performance

### Admin UI Pattern (from exploration)
- Routes: `/app/admin/*` with protected access via `beforeLoad` hook
- Existing pages: users, observability
- Uses TanStack Router with `createFileRoute()`
- StatCard component available for status display
- DataTable component for tabular data
- Pattern: manual refetch after mutations (no polling currently)

### TRPC Pattern (from exploration)
- `adminProcedure` middleware checks `user.role === "admin"`
- Long-running operation pattern exists in `mapPoster` router:
  - `generatePreview` mutation returns `jobId`
  - `getStatus` query polls for progress
- Effect Schema validation with `Schema.standardSchemaV1()`

### Python API Structure (from exploration)
- Job queue: `asyncio.Queue` + `ThreadPoolExecutor(max_workers=2)`
- Job status: In-memory dict with TTL (30 min)
- Status states: pending → processing → completed/failed/expired
- No database connection currently in Python API

### Kubernetes Pattern (from exploration)
- PostgreSQL: External (not in K8s), connection via DATABASE_URL secret
- PVC: Azure File for logs only (1Gi)
- Secrets: `web-app-secrets` secretKeyRef pattern
- Pre/Post install hooks via Helm jobs
- Non-root containers (uid 1000)

## Decisions Made

1. **Database**: PostGIS extension added to existing PostgreSQL (same database)
2. **Progress tracking**: Database table (osm_data_sources) - survives API restarts
3. **Import frequency**: Manual trigger only - no scheduled updates
4. **Fallback**: No fallback to Overpass - fail fast with clear error
5. **Storage**: Ephemeral PBF files (delete after import)
6. **Testing**: Unit tests for critical paths (PostGIS queries, status tracking)

## Critical Risk (from Metis)

**osm2pgsql schema vs OSMnx data structure mismatch**:
- Current `fetch_graph()` returns `MultiDiGraph` (NetworkX graph)
- osm2pgsql produces flat tables (`planet_osm_line`, `planet_osm_polygon`)
- Need to either: build graph from PostGIS data OR refactor rendering to use GeoDataFrame

**Mitigation**: Add Phase 0 - validate approach with small test extract before full implementation

## Scope Boundaries

### INCLUDE
- `osm_data_sources` table in schema.ts
- Python API routes for import trigger/status
- TRPC router for admin control
- Admin UI page at `/app/admin/osm-data`
- PostGIS extension setup
- Modified `poster_service.py` to query PostGIS
- Docker/Kubernetes changes for osm2pgsql tools

### EXCLUDE (to confirm)
- Scheduled automatic updates (manual trigger only?)
- Support for regions beyond CZ/SK
- Backup/restore procedures for OSM data
- Cost estimation for storage

## Technical Approach

### Phase 1: Database Infrastructure
1. Add PostGIS extension to PostgreSQL
2. Create `osm_data_sources` table with status tracking
3. Define branded ID type `OsmDataSourceId`

### Phase 2: Python Import Job
1. New `app/routes/admin.py` with POST/GET endpoints
2. Background job class for download/convert/import pipeline
3. Progress updates to database (not in-memory)

### Phase 3: PostGIS Queries
1. Replace `fetch_graph()` with PostGIS query for roads
2. Replace `fetch_features()` with PostGIS query for water/parks
3. Keep file cache as secondary layer

### Phase 4: TRPC + Admin UI
1. New TRPC router `admin.osmData.*`
2. Admin page with status cards and action buttons
3. Polling for progress updates

### Phase 5: Kubernetes/Docker
1. Add PostGIS to database or sidecar
2. osmium-tool and osm2pgsql in Docker image
3. Persistent volume for PBF files

## Geofabrik URLs
- CZ: https://download.geofabrik.de/europe/czech-republic-latest.osm.pbf
- SK: https://download.geofabrik.de/europe/slovakia-latest.osm.pbf
