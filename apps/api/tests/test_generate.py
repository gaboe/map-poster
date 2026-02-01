"""TDD tests for poster generation endpoint and job queue."""

import asyncio
import time
from unittest.mock import patch, MagicMock
import pytest
from httpx import AsyncClient, ASGITransport


@pytest.fixture(autouse=True)
def reset_job_status():
    """Reset job queue state before each test."""
    from app.job_queue import job_status

    job_status.clear()
    yield
    job_status.clear()


@pytest.fixture
def fresh_limiter():
    """Create a fresh rate limiter for isolated tests."""
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    return Limiter(key_func=get_remote_address)


# ==============================================================================
# Cache Tests
# ==============================================================================


class TestCache:
    """Tests for file-based cache functions."""

    def test_cache_path_generates_safe_filename(self):
        """Cache path should sanitize key for filesystem safety."""
        from app.poster_service import _cache_path

        key = "poster_48.8566_2.3522_noir_10000"
        path = _cache_path(key)

        assert "poster_48.8566_2.3522_noir_10000.pkl" in path
        assert "/" not in path.split("/")[-1] or "\\" not in path.split("/")[-1]

    def test_cache_get_returns_none_for_missing_key(self, tmp_path):
        """cache_get should return None when key doesn't exist."""
        from app.poster_service import cache_get

        with patch("app.poster_service.CACHE_DIR", tmp_path):
            result = cache_get("nonexistent_key")

        assert result is None

    def test_cache_set_and_get_roundtrip(self, tmp_path):
        """cache_set should store data that cache_get can retrieve."""
        from app.poster_service import cache_set, cache_get

        with patch("app.poster_service.CACHE_DIR", tmp_path):
            test_data = {"lat": 48.8566, "lon": 2.3522, "theme": "noir"}
            cache_set("test_key", test_data)
            result = cache_get("test_key")

        assert result == test_data


# ==============================================================================
# Job Queue Tests
# ==============================================================================


class TestJobQueue:
    """Tests for async job queue functionality."""

    @pytest.mark.asyncio
    async def test_add_job_returns_job_id(self):
        """Adding a job should return a UUID job_id."""
        from app.job_queue import add_job, job_status

        job_id = await add_job(
            {"lat": 48.8566, "lon": 2.3522, "theme": "noir", "distance": 10000}
        )

        assert job_id is not None
        assert len(job_id) == 36  # UUID format
        assert job_id in job_status

    @pytest.mark.asyncio
    async def test_get_job_status_returns_pending(self):
        """New job should have 'pending' status."""
        from app.job_queue import add_job, get_job_status

        job_id = await add_job(
            {"lat": 48.8566, "lon": 2.3522, "theme": "noir", "distance": 10000}
        )

        status = get_job_status(job_id)

        assert status is not None
        assert status["status"] in ["pending", "processing"]
        assert "progress" in status

    @pytest.mark.asyncio
    async def test_get_job_status_returns_none_for_unknown(self):
        """Unknown job_id should return None."""
        from app.job_queue import get_job_status

        status = get_job_status("nonexistent-job-id")

        assert status is None

    @pytest.mark.asyncio
    async def test_job_expiration_after_ttl(self):
        """Jobs should be marked expired after 30 minute TTL."""
        from app.job_queue import add_job, get_job_status, job_status

        job_id = await add_job(
            {"lat": 48.8566, "lon": 2.3522, "theme": "noir", "distance": 10000}
        )

        # Manually set created_at to 31 minutes ago
        job_status[job_id]["created_at"] = time.time() - (31 * 60)

        status = get_job_status(job_id)

        assert status["status"] == "expired"


# ==============================================================================
# Generate Endpoint Tests
# ==============================================================================


class TestGenerateEndpoint:
    """Tests for POST /api/generate endpoint."""

    @pytest.mark.asyncio
    async def test_generate_returns_job_id(self):
        """POST /api/generate should return job_id."""
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/generate",
                json={
                    "lat": 48.8566,
                    "lon": 2.3522,
                    "theme": "noir",
                    "distance": 10000,
                },
            )

        assert response.status_code == 202
        data = response.json()
        assert "job_id" in data
        assert len(data["job_id"]) == 36

    @pytest.mark.asyncio
    async def test_generate_invalid_lat_returns_400(self):
        """Invalid latitude should return 400."""
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/generate",
                json={
                    "lat": 100,  # Invalid: > 90
                    "lon": 2.3522,
                    "theme": "noir",
                    "distance": 10000,
                },
            )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_generate_invalid_lon_returns_400(self):
        """Invalid longitude should return 400."""
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/generate",
                json={
                    "lat": 48.8566,
                    "lon": 200,  # Invalid: > 180
                    "theme": "noir",
                    "distance": 10000,
                },
            )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_generate_missing_theme_returns_400(self):
        """Missing required field should return 422."""
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/generate",
                json={
                    "lat": 48.8566,
                    "lon": 2.3522,
                    # Missing: theme
                    "distance": 10000,
                },
            )

        assert response.status_code == 422


# ==============================================================================
# Rate Limiting Tests
# ==============================================================================


class TestRateLimiting:
    """Tests for rate limiting (10/minute per IP)."""

    @pytest.mark.asyncio
    async def test_rate_limit_blocks_after_limit_exceeded(self):
        """Requests exceeding rate limit should return 429."""
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            success_count = 0
            rate_limited_count = 0

            # Make 15 requests - some should succeed (up to 10), rest should be rate limited
            for i in range(15):
                response = await client.post(
                    "/api/generate",
                    json={
                        "lat": 48.8566 + i * 0.001,
                        "lon": 2.3522,
                        "theme": "noir",
                        "distance": 10000,
                    },
                )
                if response.status_code == 202:
                    success_count += 1
                elif response.status_code == 429:
                    rate_limited_count += 1

        # Should have at most 10 successful requests
        assert success_count <= 10
        # Should have at least some rate-limited requests
        assert rate_limited_count >= 5


# ==============================================================================
# Job Status Endpoint Tests
# ==============================================================================


class TestJobStatusEndpoint:
    """Tests for GET /api/jobs/{job_id} endpoint."""

    @pytest.mark.asyncio
    async def test_get_job_status_returns_status(self):
        """GET /api/jobs/{job_id} should return job status."""
        from app.main import app
        from app.job_queue import add_job

        job_id = await add_job(
            {
                "lat": 48.8566,
                "lon": 2.3522,
                "theme": "noir",
                "distance": 10000,
            }
        )

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            status_response = await client.get(f"/api/jobs/{job_id}")

        assert status_response.status_code == 200
        data = status_response.json()
        assert "status" in data
        assert data["status"] in [
            "pending",
            "processing",
            "completed",
            "failed",
            "expired",
        ]

    @pytest.mark.asyncio
    async def test_get_unknown_job_returns_404(self):
        """Unknown job_id should return 404."""
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/jobs/nonexistent-job-id")

        assert response.status_code == 404
