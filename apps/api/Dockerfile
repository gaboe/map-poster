# Multi-stage build for Map Poster API
# Stage 1: Builder - Install dependencies
FROM python:3.12-slim AS builder

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files and README (required by pyproject.toml)
COPY pyproject.toml uv.lock README.md ./

# Install dependencies (frozen lock file, no dev dependencies)
RUN uv sync --frozen --no-dev

# Stage 2: Runtime - Minimal production image
FROM python:3.12-slim

# Install runtime dependencies for OSM import and PostGIS
RUN apt-get update && apt-get install -y --no-install-recommends \
    osmium-tool \
    osm2pgsql \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 appuser

# Set working directory
WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY app ./app
COPY themes ./themes
COPY fonts ./fonts

# Create cache and posters directories with proper permissions
RUN mkdir -p /app/cache /app/posters && \
    chown -R appuser:appuser /app/cache /app/posters

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Run application with uvicorn
CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
