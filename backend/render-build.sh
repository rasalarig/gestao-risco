#!/usr/bin/env bash
# Render.com build script for the GRC Pro backend.
# This runs during every deploy.

set -o errexit  # exit on error
set -o pipefail # catch errors in pipes

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Running Alembic migrations..."
# Use DATABASE_URL_SYNC (psycopg2) for Alembic since it runs synchronously.
# If DATABASE_URL_SYNC is not set, derive it from DATABASE_URL.
if [ -z "$DATABASE_URL_SYNC" ] && [ -n "$DATABASE_URL" ]; then
    export DATABASE_URL_SYNC=$(echo "$DATABASE_URL" | sed 's|^postgres://|postgresql+psycopg2://|; s|^postgresql://|postgresql+psycopg2://|')
fi

if [ -n "$DATABASE_URL_SYNC" ]; then
    # Override alembic.ini URL with the env var
    alembic upgrade head || echo "WARNING: Alembic migration failed (tables may be created on startup instead)."
else
    echo "WARNING: DATABASE_URL_SYNC not set, skipping migrations."
fi

echo "==> Build complete."
