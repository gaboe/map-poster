import asyncio
import os
import subprocess
import tempfile
from urllib.parse import urlparse

import httpx

from app.db import fetch_one, get_connection, get_database_url


ACTIVE_STATUSES = {"downloading", "converting", "importing"}


def parse_database_url():
    parsed = urlparse(get_database_url())
    return {
        "database": parsed.path.lstrip("/"),
        "host": parsed.hostname,
        "password": parsed.password,
        "port": parsed.port or 5432,
        "user": parsed.username,
    }


def ensure_postgis_extension():
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
            connection.commit()


def update_status(
    source_code: str,
    status: str,
    progress: int,
    error_message: str | None = None,
    last_imported_at: bool = False,
):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE osm_data_sources
                SET status = %s,
                    progress = %s,
                    error_message = %s,
                    last_imported_at = CASE WHEN %s THEN NOW() ELSE last_imported_at END,
                    updated_at = NOW()
                WHERE code = %s
                """,
                (
                    status,
                    progress,
                    error_message,
                    last_imported_at,
                    source_code,
                ),
            )
            connection.commit()


def get_source(source_code: str):
    return fetch_one(
        """
        SELECT id, name, code, geofabrik_url, status, progress
        FROM osm_data_sources
        WHERE code = %s
        """,
        (source_code,),
    )


def ensure_no_active_import():
    active = fetch_one(
        """
        SELECT code, status
        FROM osm_data_sources
        WHERE status IN ('downloading', 'converting', 'importing')
        LIMIT 1
        """
    )
    if active:
        raise RuntimeError(f"Import already in progress for {active['code']}")


def download_pbf(url: str, target_path: str):
    with httpx.stream("GET", url, timeout=600, follow_redirects=True) as response:
        response.raise_for_status()
        with open(target_path, "wb") as file:
            for chunk in response.iter_bytes():
                file.write(chunk)


def run_osm2pgsql(source_path: str):
    config = parse_database_url()
    env = os.environ.copy()
    if config["password"]:
        env["PGPASSWORD"] = config["password"]

    subprocess.run(
        [
            "osm2pgsql",
            "--create",
            "--slim",
            "--drop",
            "-d",
            config["database"],
            "-H",
            config["host"],
            "-P",
            str(config["port"]),
            "-U",
            config["user"],
            source_path,
        ],
        check=True,
        env=env,
    )


def run_import(source_code: str):
    source = get_source(source_code)
    if not source:
        raise RuntimeError("Unknown OSM source")

    ensure_no_active_import()

    update_status(source_code, "downloading", 0, None, False)

    with tempfile.TemporaryDirectory() as temp_dir:
        file_path = os.path.join(temp_dir, f"{source_code}.osm.pbf")
        try:
            download_pbf(source["geofabrik_url"], file_path)
            update_status(source_code, "importing", 50, None, False)
            ensure_postgis_extension()
            run_osm2pgsql(file_path)
            update_status(source_code, "completed", 100, None, True)
        except Exception as error:
            update_status(
                source_code,
                "failed",
                0,
                str(error),
                False,
            )
            raise


async def start_import_job(source_code: str):
    await asyncio.to_thread(run_import, source_code)
