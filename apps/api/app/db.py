import os
from contextlib import contextmanager

import psycopg2
from psycopg2.extras import RealDictCursor


def get_database_url() -> str:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")
    return database_url


@contextmanager
def get_connection():
    connection = psycopg2.connect(get_database_url())
    try:
        yield connection
    finally:
        connection.close()


def fetch_all(query: str, params: tuple | None = None):
    with get_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params or ())
            rows = cursor.fetchall()
    return rows


def fetch_one(query: str, params: tuple | None = None):
    with get_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params or ())
            row = cursor.fetchone()
    return row
