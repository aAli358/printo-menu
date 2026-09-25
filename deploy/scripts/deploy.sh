#!/usr/bin/env bash
# One-click production deploy for E-Menu on a Linux VPS
# Usage: ./deploy/scripts/deploy.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> E-Menu Production Deploy"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit SECRET_KEY, POSTGRES_PASSWORD, and domain before going live."
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [ "${SECRET_KEY:-}" = "change-me-to-a-long-random-string" ]; then
  echo "WARNING: SECRET_KEY is still the default. Generate one:"
  echo "  python -c \"import secrets; print(secrets.token_urlsafe(50))\""
fi

chmod +x deploy/scripts/*.sh docker/backend/entrypoint.sh 2>/dev/null || true

echo "==> Rendering Nginx config (HTTP)..."
bash deploy/scripts/render-nginx-config.sh http

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
if [ -f docker-compose.prod.yml ] && [ "${USE_PROD_COMPOSE:-}" = "1" ]; then
  COMPOSE_FILE="docker-compose.prod.yml"
  echo "Using $COMPOSE_FILE (DEBUG=False on backend)"
fi

echo "==> Building Docker images..."
docker compose -f "$COMPOSE_FILE" build

echo "==> Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

echo "==> Waiting for database..."
sleep 8

echo "==> Running migrations..."
docker compose -f "$COMPOSE_FILE" exec -T backend python manage.py migrate --noinput

echo ""
echo "=============================================="
echo " E-Menu is running!"
echo "=============================================="
echo " HTTP:  http://${EMENU_BASE_DOMAIN:-emenu.com}"
echo " Admin: http://${EMENU_BASE_DOMAIN:-emenu.com}/admin/"
echo ""
echo " Next steps:"
echo "  1. Point DNS A record  ${EMENU_BASE_DOMAIN:-emenu.com} -> this server IP"
echo "  2. Point DNS A record  *.${EMENU_BASE_DOMAIN:-emenu.com} -> this server IP"
echo "  3. Create superuser: docker compose -f $COMPOSE_FILE exec backend python manage.py createsuperuser"
echo "  4. Enable SSL:       ./deploy/scripts/setup-ssl.sh"
echo "=============================================="
