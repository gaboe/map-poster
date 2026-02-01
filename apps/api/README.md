# Map Poster API

FastAPI service for generating map posters using OpenStreetMap data.

## Local Development

### Prerequisites
- Python 3.12+
- [uv](https://github.com/astral-sh/uv) package manager

### Setup
```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload --port 8000
```

### Run Tests
```bash
# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test file
uv run pytest tests/test_health.py
```

## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string (PostGIS required)

## API Endpoints

### Health Check

```
GET /api/health
```

Returns the health status of the API.

**Response:**
```json
{
  "status": "ok"
}
```

### List Themes

```
GET /api/themes
```

Returns all available themes for map poster generation.

**Response:**
```json
[
  {
    "id": "noir",
    "name": "Noir",
    "description": "Dark theme with high contrast",
    "colors": {...}
  },
  ...
]
```

### Generate Poster

```
POST /api/generate
```

Submit a request to generate a map poster. Returns a job ID for tracking progress.

**Request Body:**
```json
{
  "lat": 50.0755,
  "lon": 14.4378,
  "theme": "noir",
  "zoom": 13
}
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Rate Limiting:** 10 requests per minute per IP address

### Get Job Status

```
GET /api/jobs/{job_id}
```

Get the status and progress of a poster generation job.

**Response (Queued):**
```json
{
  "status": "queued",
  "progress": 0
}
```

**Response (Processing):**
```json
{
  "status": "processing",
  "progress": 45
}
```

**Response (Completed):**
```json
{
  "status": "completed",
  "progress": 100,
  "url": "/posters/550e8400-e29b-41d4-a716-446655440000.png"
}
```

**Response (Failed):**
```json
{
  "status": "failed",
  "progress": 0,
  "error": "Error message describing what went wrong"
}
```

## Cache

Generated posters are cached in the `cache/` directory using pickle format for fast retrieval.

**Cache Key Format:** `{lat}_{lon}_{zoom}_{theme}.pkl`

### Clear Cache

```bash
# Remove all cached posters
rm -rf cache/*

# Or in Docker
docker exec <container_id> rm -rf /app/cache/*
```

## Docker

### Build Image

```bash
docker build -t map-poster-api:latest .
```

### Run Container

```bash
# Basic run
docker run -p 8000:8000 map-poster-api:latest

# With volume for persistent cache
docker run -p 8000:8000 -v api-cache:/app/cache map-poster-api:latest

# With environment variables
docker run -p 8000:8000 \
  -e LOG_LEVEL=info \
  map-poster-api:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - api-cache:/app/cache
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

volumes:
  api-cache:
```

## Rate Limiting

The API enforces rate limiting to prevent abuse:

- **Limit:** 10 requests per minute per IP address
- **Enforced on:** `/api/generate` endpoint
- **Response:** 429 Too Many Requests when limit exceeded

## Architecture

### Project Structure

```
app/
├── main.py              # FastAPI application entry point
├── routes/
│   └── generate.py      # Poster generation endpoint
├── job_queue.py         # Background job processor
├── poster_service.py    # Core poster generation logic
├── themes.py            # Theme definitions and utilities
└── __init__.py

themes/                  # 17 theme JSON files
fonts/                   # Custom fonts for rendering
cache/                   # Generated poster cache (gitignored)
posters/                 # Output directory for generated posters
```

### Key Components

- **FastAPI App** - REST API with async request handling
- **Job Queue** - Background task processor for long-running operations
- **Poster Service** - Core logic for map rendering using geopandas and matplotlib
- **Themes** - 17 pre-configured color schemes and styles
- **Rate Limiter** - slowapi-based request throttling

## Development Workflow

1. **Make changes** to Python code
2. **Run tests** to verify: `uv run pytest`
3. **Test locally** with: `uv run uvicorn app.main:app --reload`
4. **Build Docker image** to test containerized version
5. **Push changes** when tests pass

## Troubleshooting

### Import Errors

If you see import errors, ensure dependencies are installed:

```bash
uv sync
```

### Port Already in Use

If port 8000 is already in use:

```bash
# Use a different port
uv run uvicorn app.main:app --reload --port 8001
```

### Cache Issues

If generated posters look incorrect, clear the cache:

```bash
rm -rf cache/*
```

### Docker Build Fails

Ensure you're using Python 3.12 slim base image (not Alpine) due to geopandas compilation requirements:

```bash
# Verify Dockerfile uses python:3.12-slim
grep "FROM python" Dockerfile
```

## Performance

- **Health check:** <10ms
- **Theme listing:** <50ms
- **Poster generation:** 5-30 seconds (depends on zoom level and theme complexity)
- **Cache hit:** <100ms

## OSM Data Import

### Server Requirements

- **RAM:** 4-8GB recommended (import can use 2-4GB)
- **Disk:** 10GB+ free (CZ ~2GB, SK ~1GB after import)

### Triggering Import

1. Go to Admin → OSM Data Sources
2. Click **Import** for Czech Republic or Slovakia
3. Wait for completion (can take 30-60 minutes)

### Troubleshooting

- **Import fails with OOM:** Upgrade server RAM to 8GB
- **Slow poster generation:** Verify PostGIS is available and indexes exist
- **Location not available:** Coordinates must be within CZ/SK imports

## License

MIT
