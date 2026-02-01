"""
Async Job Queue for Poster Generation

This module provides:
- In-memory job queue using asyncio.Queue
- ThreadPoolExecutor for blocking matplotlib operations
- Job status tracking with TTL (30 minutes)
- Background job processing
"""

import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, Optional
from uuid import uuid4

import structlog

from app.poster_service import create_poster


logger = structlog.get_logger()

# Job TTL in seconds (30 minutes)
JOB_TTL_SECONDS = 30 * 60

# Global state
job_queue: asyncio.Queue = asyncio.Queue()
job_status: Dict[str, Dict[str, Any]] = {}
executor = ThreadPoolExecutor(max_workers=2)

# Flag to track if processor is running
_processor_started = False


async def add_job(params: Dict[str, Any]) -> str:
    """
    Add a new job to the queue.

    Args:
        params: Job parameters containing lat, lon, theme, distance, etc.

    Returns:
        Unique job_id (UUID)
    """
    job_id = str(uuid4())

    job_status[job_id] = {
        "status": "pending",
        "progress": 0,
        "url": None,
        "error": None,
        "created_at": time.time(),
        "params": params,
    }

    await job_queue.put(
        {
            "job_id": job_id,
            "params": params,
        }
    )

    logger.info("job_added", job_id=job_id, params=params)

    return job_id


def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """
    Get the status of a job.

    Checks TTL and marks job as expired if necessary.

    Args:
        job_id: The job identifier

    Returns:
        Job status dict or None if not found
    """
    if job_id not in job_status:
        return None

    status = job_status[job_id]

    # Check TTL
    age = time.time() - status["created_at"]
    if age > JOB_TTL_SECONDS and status["status"] not in ["completed", "failed"]:
        status["status"] = "expired"

    return {
        "status": status["status"],
        "progress": status["progress"],
        "url": status["url"],
        "error": status["error"],
    }


def _render_poster_sync(job_id: str, params: Dict[str, Any]) -> None:
    """
    Synchronous poster rendering function to run in thread pool.

    Args:
        job_id: The job identifier
        params: Job parameters
    """
    try:
        job_status[job_id]["status"] = "processing"
        job_status[job_id]["progress"] = 10

        output_path = create_poster(
            lat=params["lat"],
            lon=params["lon"],
            theme_id=params["theme"],
            distance=params["distance"],
            city=params.get("city", "City"),
            country=params.get("country", "Country"),
        )

        job_status[job_id]["status"] = "completed"
        job_status[job_id]["progress"] = 100
        job_status[job_id]["url"] = f"/api/posters/{output_path.split('/')[-1]}"

        logger.info("job_completed", job_id=job_id, output_path=output_path)

    except Exception as e:
        job_status[job_id]["status"] = "failed"
        job_status[job_id]["error"] = str(e)
        logger.error("job_failed", job_id=job_id, error=str(e))


async def process_jobs() -> None:
    """
    Background task to process jobs from the queue.

    Runs blocking matplotlib operations in thread pool.
    """
    loop = asyncio.get_event_loop()

    while True:
        try:
            job = await job_queue.get()
            job_id = job["job_id"]
            params = job["params"]

            logger.info("job_processing", job_id=job_id)

            # Run blocking matplotlib in thread pool
            await loop.run_in_executor(executor, _render_poster_sync, job_id, params)

            job_queue.task_done()

        except asyncio.CancelledError:
            logger.info("job_processor_cancelled")
            break
        except Exception as e:
            logger.error("job_processor_error", error=str(e))


async def start_job_processor() -> asyncio.Task:
    """
    Start the background job processor.

    Returns:
        The asyncio Task running the processor
    """
    global _processor_started

    if not _processor_started:
        _processor_started = True
        task = asyncio.create_task(process_jobs())
        logger.info("job_processor_started")
        return task

    return None


def cleanup_expired_jobs() -> int:
    """
    Remove expired jobs from status dict.

    Returns:
        Number of jobs cleaned up
    """
    current_time = time.time()
    expired_ids = []

    for job_id, status in job_status.items():
        age = current_time - status["created_at"]
        if age > JOB_TTL_SECONDS * 2:  # Remove after 2x TTL
            expired_ids.append(job_id)

    for job_id in expired_ids:
        del job_status[job_id]

    if expired_ids:
        logger.info("jobs_cleaned_up", count=len(expired_ids))

    return len(expired_ids)
