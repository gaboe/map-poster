"""
Map Poster API - FastAPI Application

Main application entry point with:
- Health endpoint
- Themes endpoint
- Generate endpoint with rate limiting
- Job status endpoint
- Background job processor
"""

import logging
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.job_queue import start_job_processor
from app.routes.generate import limiter, router as generate_router
from app.themes import list_themes


# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logging.basicConfig(
    format="%(message)s",
    stream=None,
    level=logging.INFO,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - starts background job processor."""
    logger.info("app_startup", message="Starting job processor")
    task = await start_job_processor()
    yield
    if task:
        task.cancel()
    logger.info("app_shutdown", message="Job processor stopped")


app = FastAPI(
    title="map-poster-api",
    version="0.1.0",
    description="API for generating beautiful map posters",
    lifespan=lifespan,
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include routers
app.include_router(generate_router)


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    logger.info("health_check", endpoint="/api/health")
    return JSONResponse({"status": "ok"}, status_code=200)


@app.get("/api/themes")
async def get_themes():
    """List all available themes."""
    logger.info("list_themes", endpoint="/api/themes")
    themes = list_themes()
    return JSONResponse(themes, status_code=200)
