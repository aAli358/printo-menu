#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

git pull origin main

docker compose -f docker-compose.yml exec backend python manage.py migrate
docker compose -f docker-compose.yml exec backend python manage.py collectstatic --noinput
docker compose -f docker-compose.yml up -d --build backend frontend

echo "Deploy complete."
