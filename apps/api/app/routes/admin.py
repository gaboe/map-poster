import asyncio

from fastapi import APIRouter
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.db import fetch_all, fetch_one
from app.osm_import import ACTIVE_STATUSES, start_import_job


router = APIRouter()


@router.get("/api/admin/osm/sources")
async def list_sources():
    sources = fetch_all(
        """
        SELECT
            id,
            name,
            code,
            geofabrik_url,
            file_size_bytes,
            status,
            progress,
            error_message,
            last_imported_at,
            created_at,
            updated_at
        FROM osm_data_sources
        ORDER BY code
        """
    )

    return JSONResponse(
        content=jsonable_encoder(sources),
        status_code=200,
    )


@router.post("/api/admin/osm/import/{source_code}")
async def start_import(source_code: str):
    if source_code not in {"cz", "sk"}:
        return JSONResponse(
            content={"detail": "Unknown source"},
            status_code=400,
        )

    active = fetch_one(
        """
        SELECT code, status
        FROM osm_data_sources
        WHERE status IN ('downloading', 'converting', 'importing')
        LIMIT 1
        """
    )
    if active and active["code"] != source_code:
        return JSONResponse(
            content={
                "detail": "Another import is already running",
                "active": active,
            },
            status_code=409,
        )

    status = fetch_one(
        """
        SELECT status
        FROM osm_data_sources
        WHERE code = %s
        """,
        (source_code,),
    )
    if not status:
        return JSONResponse(
            content={"detail": "Source not found"},
            status_code=404,
        )

    if status["status"] in ACTIVE_STATUSES:
        return JSONResponse(
            content={"detail": "Import already running"},
            status_code=409,
        )

    asyncio.create_task(start_import_job(source_code))

    return JSONResponse(
        content={"message": "Import started", "source_code": source_code},
        status_code=202,
    )


@router.get("/api/admin/osm/status/{source_code}")
async def get_import_status(source_code: str):
    source = fetch_one(
        """
        SELECT
            id,
            name,
            code,
            geofabrik_url,
            file_size_bytes,
            status,
            progress,
            error_message,
            last_imported_at,
            created_at,
            updated_at
        FROM osm_data_sources
        WHERE code = %s
        """,
        (source_code,),
    )

    if not source:
        return JSONResponse(
            content={"detail": "Source not found"},
            status_code=404,
        )

    return JSONResponse(
        content=jsonable_encoder(source),
        status_code=200,
    )
