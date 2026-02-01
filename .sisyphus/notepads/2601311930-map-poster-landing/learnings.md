# Learnings - Map Poster Landing Page

## Conventions & Patterns
_Document discovered patterns, naming conventions, architectural decisions_

---

## tRPC Router Patterns

### Map Poster Router Structure
- Location: `apps/web-app/src/map-poster/trpc/router.ts`
- Uses `publicProcedure` for unauthenticated endpoints
- Input validation with Effect Schema + `Schema.standardSchemaV1()`
- Three procedures:
  - `generatePreview` (mutation): Takes lat/lon/theme, returns jobId
  - `getStatus` (query): Takes jobId, returns status/progress/url
  - `listThemes` (query): Returns array of theme objects
- Router registered in `apps/web-app/src/infrastructure/trpc/router/index.ts` as `mapPoster`

### Effect Schema Validation
- Always wrap with `Schema.standardSchemaV1()` for TRPC compatibility
- Use `Schema.Number.pipe(Schema.between(-90, 90, {...}))` for range validation
- Use `Schema.String.pipe(Schema.minLength(1, {...}))` for string validation
- Error messages provided via `message: () => "..."` callback

### Router Registration Pattern
- Import router: `import { router as mapPosterRouter } from "@/map-poster/trpc/router"`
- Add to appRouter object with camelCase key: `mapPoster: mapPosterRouter`
- Routers are alphabetically sorted in appRouter definition

### Placeholder Implementation
- Return mock data matching expected output schema
- Add comments: `// Placeholder: will call Python API in next task`
- Allows frontend development to proceed in parallel with backend API integration

---

## FastAPI Project Setup (Task 3)

### uv Configuration Best Practices
- Use `dependency-groups.dev` instead of deprecated `tool.uv.dev-dependencies`
- Specify `packages` in `[tool.hatch.build.targets.wheel]` to avoid build errors
- Always include `README.md` in project root for build system
- Use version ranges (>=X.Y.Z) instead of exact versions for flexibility

### FastAPI + httpx Testing Pattern
- Use `ASGITransport` from httpx to test FastAPI apps:
  ```python
  from httpx import AsyncClient, ASGITransport
  transport = ASGITransport(app=app)
  async with AsyncClient(transport=transport, base_url="http://test") as client:
      response = await client.get("/api/health")
  ```
- Configure pytest with `asyncio_mode = "auto"` in `pyproject.toml`
- Use `@pytest.mark.asyncio` decorator for async tests

### Structlog Setup for Production
- Configure structlog with JSON processors for structured logging
- Use `structlog.get_logger()` for consistent logging across the app
- Logging pattern: `logger.info(context_dict, "message")`
- Configure both structlog and stdlib logging for compatibility

### TDD Approach Verification
- Write test first (test_health.py)
- Implement minimal code to pass test (app/main.py)
- Run `uv run pytest` to verify
- Clean up unnecessary files (themes.py, themes/ directory)

### Project Structure
```
apps/api/
├── app/
│   ├── __init__.py
│   └── main.py          # FastAPI app with health endpoint
├── tests/
│   ├── __init__.py
│   └── test_health.py   # Health endpoint test
├── pyproject.toml       # uv project config
├── README.md
└── uv.lock             # Locked dependencies
```

### Core Dependencies
- **Web**: fastapi, uvicorn
- **Validation**: pydantic
- **Logging**: structlog
- **Testing**: pytest, pytest-asyncio
- **HTTP Client**: httpx (for testing)

## Theme Management Implementation

### Theme JSON Structure
Each theme file contains:
- `name`: Display name (e.g., "Noir")
- `description`: Theme description
- `bg`: Background color hex
- `text`: Text color hex
- `gradient_color`: Gradient overlay color
- `water`: Water features color
- `parks`: Parks/green areas color
- `road_motorway`, `road_primary`, `road_secondary`, `road_tertiary`, `road_residential`, `road_default`: Road colors by type

### Implementation Pattern
- **TDD Approach**: Tests written first, then implementation
- **Module Location**: `app/themes.py` with two functions:
  - `load_theme(theme_id)`: Loads single theme, falls back to terracotta if not found
  - `list_themes()`: Returns list of all 17 themes with id, name, description
- **API Endpoint**: `GET /api/themes` returns JSON array of theme metadata
- **Case Insensitivity**: Theme IDs normalized to lowercase for flexible loading

### All 17 Themes
1. noir
2. midnight_blue
3. terracotta
4. japanese_ink
5. neon_cyberpunk
6. warm_beige
7. pastel_dream
8. emerald
9. forest
10. ocean
11. sunset
12. autumn
13. copper_patina
14. monochrome_blue
15. blueprint
16. contrast_zones
17. gradient_roads

### Test Coverage
- 13 unit tests covering:
  - Theme loading with specific themes
  - Required keys validation
  - Fallback behavior
  - Case insensitivity
  - List themes count and structure
  - All 17 themes present
  - No duplicate theme IDs

---

## Poster Generation Implementation (Task 5)

### Job Queue Pattern
- Use `asyncio.Queue` for job management with `ThreadPoolExecutor` for blocking operations
- Global state: `job_status` dict tracks {job_id: {status, progress, url, created_at, params}}
- Job processor runs as background task started in FastAPI lifespan
- Job TTL: 30 minutes (configurable via `JOB_TTL_SECONDS`)
- Pattern: `loop.run_in_executor(executor, sync_function, args)`

### Rate Limiting with slowapi
- Import: `from slowapi import Limiter`
- Key function: `get_remote_address` for IP-based limiting
- Decorator: `@limiter.limit("10/minute")` on endpoint
- Add to app state: `app.state.limiter = limiter`
- Exception handler: `app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)`
- Rate limiter state persists in memory - reset between tests with fixtures

### Test Fixtures for API Tests
```python
@pytest.fixture(autouse=True)
def reset_rate_limiter():
    from app.routes.generate import limiter
    if hasattr(limiter, "_storage") and limiter._storage:
        try:
            limiter._storage.reset()
        except AttributeError:
            pass
    yield

@pytest.fixture(autouse=True)
def reset_job_status():
    from app.job_queue import job_status
    job_status.clear()
    yield
```

### Ported Functions from maptoposter
- `_cache_path(key)` - Generate safe pickle filename
- `cache_get(key)` / `cache_set(key, value)` - File-based caching with pickle
- `is_latin_script(text)` - Detect Latin vs non-Latin text for letter-spacing
- `load_fonts()` - Load Roboto fonts from fonts/ directory
- `get_coordinates(city, country)` - Nominatim geocoding with caching
- `fetch_graph(point, dist)` - OSMnx street network with caching
- `fetch_features(point, dist, tags, name)` - OSMnx features with caching
- `get_edge_colors_by_type(g, theme)` - Road colors by highway type
- `get_edge_widths_by_type(g)` - Line widths by road importance
- `create_gradient_fade(ax, color, location, zorder)` - Gradient overlays
- `get_crop_limits(g_proj, center, fig, dist)` - Viewport cropping
- `create_poster(lat, lon, theme_id, distance, ...)` - Main rendering (150 DPI)

### Cache Key Patterns
- Coordinates: `f"coords_{city.lower()}_{country.lower()}"`
- Graph: `f"graph_{lat}_{lon}_{dist}"`
- Features: `f"{name}_{lat}_{lon}_{dist}_{tag_str}"`

### Rendering at 150 DPI
- Output DPI set to 150 (instead of 300) for faster generation
- Configurable via `OUTPUT_DPI` constant


## [2026-01-31] Task 4: Generation Endpoint

### Implementation Summary
The generation endpoint was largely implemented in previous tasks. This task finalized:
- Copied Roboto fonts from `opensrc/repos/github.com/originalankur/maptoposter/fonts/`
- Created `cache/` and `posters/` directories
- Verified all 28 tests pass

### Job Queue Implementation
- Uses `asyncio.Queue` for job storage (in-memory, no Redis needed)
- `ThreadPoolExecutor(max_workers=2)` for blocking matplotlib operations
- Job dict structure: `{"status", "progress", "url", "error", "created_at", "params"}`
- Background processor started via FastAPI lifespan handler
- Job TTL: 30 minutes, cleanup at 2x TTL

### Rate Limiting Setup
- Using `slowapi` library with `Limiter(key_func=get_remote_address)`
- Limit: `10/minute` per IP address on `/api/generate` endpoint
- Rate limit exceeded returns 429 status code
- Exception handler added via `app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)`

### Cache Strategy
- File-based cache using pickle serialization
- Cache directory: `apps/api/cache/`
- Key format examples:
  - Coordinates: `coords_{city}_{country}`
  - Graph: `graph_{lat}_{lon}_{dist}`
  - Features: `{name}_{lat}_{lon}_{dist}_{tags}`
- Cache errors are caught and logged, not propagated

### Ported Functions from create_map_poster.py
| Function | Purpose |
|----------|---------|
| `cache_get/cache_set` | Pickle-based file caching |
| `is_latin_script` | Detect script for typography spacing |
| `get_coordinates` | Nominatim geocoding with rate limiting |
| `fetch_graph` | OSM street network via osmnx |
| `fetch_features` | Water/parks features via osmnx |
| `get_edge_colors_by_type` | Road colors by highway type |
| `get_edge_widths_by_type` | Road widths by importance |
| `create_gradient_fade` | Top/bottom fade effect |
| `get_crop_limits` | Viewport aspect ratio calculation |
| `create_poster` | Main rendering pipeline |

### Key Differences from Original
1. DPI reduced from 300 to 150 for faster generation
2. No tqdm progress bars (runs in background)
3. Theme loaded via `app/themes.py` module
4. Output path uses timestamps for uniqueness
5. Returns file path instead of printing

## [2026-01-31] Task 6: tRPC Integration with Python API

### Implementation Summary
- Implemented three tRPC procedures to call Python FastAPI backend
- Added MAP_POSTER_API_URL environment variable with default http://localhost:8000
- Mapped Python API errors to tRPC error helpers

### Key Patterns Used
1. **External API Pattern** (from contact/router.ts):
   - Fetch with POST/GET methods
   - Error handling with response.ok check
   - JSON parsing with .catch() fallback
   - Error mapping to tRPC error helpers

2. **Error Mapping**:
   - HTTP 404 → notFoundError()
   - HTTP 400+ → badRequestError()
   - Catch-all → internalServerError()

3. **Environment Variables**:
   - Added to env/server.ts with z.string().url().default()
   - Added to .env and .env.example files
   - Alphabetically sorted in env config

### Procedures Implemented
1. **generatePreview** (mutation):
   - POST to /api/generate with {lat, lon, theme}
   - Returns {jobId}
   - Validates lat (-90 to 90) and lon (-180 to 180)

2. **getStatus** (query):
   - GET from /api/jobs/{jobId}
   - Returns {status, progress, url}
   - Handles 404 with notFoundError

3. **listThemes** (query):
   - GET from /api/themes
   - Returns array of {name, id}

### Testing Notes
- Python API must be running on http://localhost:8000
- tRPC endpoints are public (no authentication required)
- Error responses from Python API are mapped to tRPC error codes

## [2026-01-31] Task 7: Landing Page UI

### Layout Structure
- Grid layout: 2/3 preview area (left), 1/3 controls panel (right)
- Desktop-focused design with responsive breakpoints
- Sticky controls panel for better UX
- shadcn components: Card, Select, Input, Button, Skeleton

### Design Aesthetic
- **Bold cartographic theme**: Map-inspired grid backgrounds, gradient meshes
- **Typography**: Large 6xl/7xl hero heading with gradient text
- **Color palette**: Blue-slate gradient scheme with depth
- **Spatial composition**: Asymmetric grid with generous spacing
- **Visual details**: Animated loading states, progress bars, grid overlays

### tRPC Integration
- `useSuspenseQuery` for themes list (17 themes available)
- `useMutation` for generatePreview (returns jobId)
- `useQuery` with polling (2s interval) for status tracking
- Proper error handling with status messages

### State Management
- Form state: selectedTheme, location, jobId
- Auto-select first theme on load
- Poll status only when jobId exists
- Stop polling when status is completed/failed

### Loading States
- Skeleton with animated map grid background
- Progress bar showing generation percentage
- Status messages for pending/processing/completed/failed
- Smooth transitions between states

### SEO Implementation
- Full meta tags with createPageTitle helper
- OpenGraph image reference
- Canonical links
- Keywords for map poster discovery

### Features Section
- 3-column grid showcasing key benefits
- Icon-based visual hierarchy
- Consistent spacing and typography

## [2026-01-31] Task 7: Landing Page UI

### Route Structure
Created `/poster` route with TanStack Router pattern:
- `apps/web-app/src/routes/_web/poster/route.tsx` - Route wrapper with Outlet
- `apps/web-app/src/routes/_web/poster/index.tsx` - Main landing page (379 lines)

### Layout & Design
**Aesthetic Direction: Editorial/Magazine with Gradient Mesh**
- Desktop-focused 70/30 split (preview area / controls panel)
- Bold gradient backgrounds: `from-slate-50 via-blue-50 to-slate-100`
- Large hero typography with gradient text effects
- Animated loading states with grid patterns
- Progress bar with smooth transitions

### Components Used
- **Card** - Container for preview and controls
- **Select** - Theme dropdown (17 themes available)
- **Input** - Location search with MapPin icon
- **Button** - Generate action with loading states
- **Skeleton** - Loading placeholder (not used, custom animation instead)

### TRPC Integration
```typescript
// Queries
const { data: themes } = useSuspenseQuery(
  trpc.mapPoster.listThemes.queryOptions()
);

const { data: status } = useQuery({
  ...trpc.mapPoster.getStatus.queryOptions({ jobId }),
  enabled: !!jobId,
  refetchInterval: (query) => {
    const data = query.state.data;
    if (data?.status === "completed" || data?.status === "failed") {
      return false;
    }
    return 2000; // Poll every 2 seconds
  },
});

// Mutations
const generateMutation = useMutation(
  trpc.mapPoster.generatePreview.mutationOptions({
    onSuccess: (data) => setJobId(data.jobId),
    onError: (error) => console.error(error),
  })
);
```

### Loading States
**Three states handled:**
1. **Empty** - Grid pattern background, MapPin icon, placeholder text
2. **Generating** - Animated grid, pulsing MapPin, progress bar with percentage
3. **Complete** - Display generated poster image from `status.url`

### SEO Metadata
- Title: "Map Poster Generator - Create Beautiful City Maps"
- Description: Detailed with keywords
- Canonical URL: `https://map-poster.cz/poster`
- OG image: `/api/og/page/poster.png`

### Features Section
Added 3-column grid showcasing:
- 17 Unique Themes
- Any Location worldwide
- Instant AI Generation

### Key Patterns
- **Polling**: `refetchInterval` with conditional logic based on status
- **State Management**: Local state for theme, location, jobId
- **Error Handling**: Status messages for failed/completed states
- **Responsive**: Grid layout with `lg:grid-cols-[1fr_400px]`

### Design Decisions
- **No mobile-first**: Desktop-focused for MVP
- **No download button**: Preview only (as per requirements)
- **Mock geocoding**: Uses Prague coordinates (50.0755, 14.4378) for all locations
- **Sticky controls**: Controls panel uses `sticky top-8` on desktop

### Verification
- Files created successfully
- Route accessible at `/poster`
- TypeCheck shows expected dependency errors (React types, etc.) - normal for dev

## [2025-01-31] Task 8: Geolocation with IP Fallback

### Implementation Complete

**Files Created:**
- `apps/web-app/src/map-poster/hooks/use-geolocation.ts` - Custom hook with fallback chain

**Files Modified:**
- `apps/web-app/src/routes/_web/poster/index.tsx` - Integrated hook and auto-fill

### Fallback Chain
1. Browser geolocation API (navigator.geolocation.getCurrentPosition)
2. IP-based geolocation (ip-api.com/json)
3. Prague default (50.0755, 14.4378)

### Hook Pattern
- Custom `useGeolocation()` hook returns `{lat, lon, city, status}`
- Status states: "loading" | "success" | "error"
- Integrated into poster page for auto-fill on mount
- Uses geolocation coordinates in `handleGenerate()` for map generation

### Key Features
- No permission modals (browser handles permission UI)
- Graceful fallback chain with no data loss
- Auto-fills location input when geolocation succeeds
- Uses actual coordinates for map generation instead of hardcoded Prague

### Testing Notes
- Hook returns valid coordinates from all three fallback paths
- Poster page auto-fills location on component mount
- Generate button uses geolocation coordinates

## [2026-01-31] Task 8: Geolocation with IP Fallback

### Implementation Complete
- Created `useGeolocation` hook at `apps/web-app/src/map-poster/hooks/use-geolocation.ts`
- Integrated into poster page at `apps/web-app/src/routes/_web/poster/index.tsx`

### Fallback Chain
1. Browser `navigator.geolocation.getCurrentPosition()` - Gets precise coordinates
2. IP-based: `http://ip-api.com/json/` - Free, CORS-enabled, returns city + country
3. Prague default: 50.0755, 14.4378 - Fallback when all else fails

### Hook Pattern
- `useState` for geolocation state with initial Prague default
- `useEffect` for async geolocation fetch (runs once on mount)
- Returns: `{ lat: number, lon: number, city: string, status: "loading" | "success" | "error" }`
- Browser geolocation returns "Current Location" as city (no reverse geocoding)
- IP API returns formatted city as "City, Country"

### Integration Details
- Hook auto-fills location input when geolocation succeeds
- `handleGenerate` uses detected coordinates instead of hardcoded Prague
- Graceful fallback: if geolocation fails, still uses Prague coordinates
- No permission prompts or error UI (silent fallback as requested)

### Type Safety
- Fixed TypeScript errors in Select component (value can be null)
- Added null checks for geolocation.city before setting location
- Proper type guards for theme selection

### Notes
- IP API is free and doesn't require authentication
- Browser geolocation may prompt user for permission (depends on browser/site settings)
- All three fallback methods complete silently without user interaction

## [2026-01-31] Task 9: Dockerfile + README

### Dockerfile Pattern
- Multi-stage build with Python 3.12 slim (NOT Alpine - geopandas needs compilation)
- uv for dependency management via `ghcr.io/astral-sh/uv:latest`
- Non-root user (appuser, UID 1000) for security
- Health check endpoint using Python urllib
- Both cache/ and posters/ directories need proper permissions for non-root user

### Key Learnings
1. **README.md required**: pyproject.toml references README.md, so it must be copied in builder stage
2. **Directory permissions**: Non-root user needs write access to cache/ and posters/ directories
3. **Health check**: Uses Python urllib instead of curl (lighter weight)
4. **Multi-stage build**: Reduces final image size by excluding build tools

### README Structure
- Local development setup with uv
- Comprehensive API endpoint documentation with request/response examples
- Cache management and cleanup instructions
- Docker build and run examples with docker-compose
- Rate limiting documentation
- Architecture overview with project structure
- Troubleshooting section
- Performance metrics

### Verification
✅ Docker build succeeds
✅ Container starts without errors
✅ Health endpoint responds with {"status":"ok"}
✅ Non-root user runs application
✅ Cache and posters directories created with correct permissions

## [2025-01-31] Task 11: E2E Integration Testing

### E2E Test Scenarios Implemented
1. **Page Load** - Verifies initial state with all UI elements visible
2. **Geolocation** - Tests auto-fill of location from browser geolocation
3. **Form Validation** - Checks button enable/disable based on form state
4. **Generation Flow** - Tests poster generation with loading state
5. **Theme Switching** - Verifies theme change triggers regeneration
6. **Error Handling** - Tests error state display on API failure
7. **Success State** - Tests success message and image display

### Playwright E2E Patterns Used
- `page.goto()` for navigation
- `page.waitForLoadState("networkidle")` for page readiness
- `waitForHydration()` for React hydration
- `context.grantPermissions()` for geolocation
- `context.setGeolocation()` for mock location
- `page.route()` for API mocking
- `page.getByLabel()`, `page.getByRole()` for accessible selectors
- `page.locator()` for complex selectors
- `expect().toBeVisible()`, `expect().toBeDisabled()` for assertions

### Key Test Insights
- Geolocation requires both `grantPermissions()` and `setGeolocation()`
- API mocking uses `route.fulfill()` with proper JSON structure
- Loading state appears during generation (2s polling interval)
- Success/error messages in colored boxes (green/red)
- Image element has alt text "Generated map poster"
- Theme selector is a combobox with options
- Generate button disabled until location + theme selected

### Test File Location
`apps/web-app/e2e/map-poster.e2e.ts` - 7 test scenarios

### Running Tests
```bash
bun run test:e2e -- --grep "Map Poster"
bun run test:e2e:ui  # Interactive mode
```

## [2026-01-31] Final Verification

### All Tests Pass
- ✅ Python pytest: 28/28 tests passed
- ✅ TypeScript typecheck: 0 errors
- ✅ Docker build: Success

### Must Have Features
- ✅ Browser geolocation with IP fallback
- ✅ 17 theme options from maptoposter
- ✅ Loading skeleton during generation
- ✅ Error handling for network/API failures
- ✅ Health check endpoint for K8s

### Must NOT Have (Verified Absent)
- ✅ No user authentication
- ✅ No high-resolution export (150 DPI only)
- ✅ No custom theme editor
- ✅ No save/download functionality
- ✅ No social sharing
- ✅ No WebSocket (polling only)
- ✅ No payment/monetization
- ✅ No print ordering

### Documentation
- ✅ README.md complete with API docs
- ✅ Dockerfile with multi-stage build
- ✅ Cache management instructions
