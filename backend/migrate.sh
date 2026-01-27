#!/bin/bash

# Migration script that ensures venv is activated

set -e

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: make install"
    exit 1
fi

# Activate venv and run migration
source venv/bin/activate
alembic upgrade head

echo "✅ Migration completed successfully!"
