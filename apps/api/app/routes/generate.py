"""
Generate Endpoint Routes

POST /api/generate - Submit poster generation job
GET /api/jobs/{job_id} - Get job status
"""

from typing import Optional

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.job_queue import add_job, get_job_status


# Rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()


class GenerateRequest(BaseModel):
    """Request body for poster generation."""

    lat: float = Field(..., ge=-90, le=90, description="Latitude (-90 to 90)")
    lon: float = Field(..., ge=-180, le=180, description="Longitude (-180 to 180)")
    theme: str = Field(..., min_length=1, description="Theme identifier")
    distance: int = Field(
        default=10000, ge=1000, le=50000, description="Map radius in meters"
    )
    city: Optional[str] = Field(default="City", description="City name for display")
    country: Optional[str] = Field(
        default="Country", description="Country name for display"
    )


class GenerateResponse(BaseModel):
    """Response from generate endpoint."""

    job_id: str


class JobStatusResponse(BaseModel):
    """Response from job status endpoint."""

    status: str
    progress: int
    url: Optional[str] = None
    error: Optional[str] = None


@router.post(
    "/api/generate",
    response_model=GenerateResponse,
    status_code=202,
    summary="Generate a map poster",
    description="Submit a job to generate a map poster. Returns immediately with a job_id.",
)
@limiter.limit("10/minute")
async def generate(request: Request, body: GenerateRequest):
    """
    Submit a poster generation job.

    Returns job_id immediately. Use GET /api/jobs/{job_id} to check status.
    """
    job_id = await add_job(
        {
            "lat": body.lat,
            "lon": body.lon,
            "theme": body.theme,
            "distance": body.distance,
            "city": body.city,
            "country": body.country,
        }
    )

    return JSONResponse(
        content={"job_id": job_id},
        status_code=202,
    )


@router.get(
    "/api/jobs/{job_id}",
    response_model=JobStatusResponse,
    summary="Get job status",
    description="Check the status of a poster generation job.",
)
async def get_status(job_id: str):
    """
    Get the status of a poster generation job.

    Returns status, progress percentage, and URL when complete.
    """
    status = get_job_status(job_id)

    if status is None:
        return JSONResponse(
            content={"detail": "Job not found"},
            status_code=404,
        )

    return JSONResponse(content=status, status_code=200)
