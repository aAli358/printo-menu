#!/usr/bin/env bash
# Render Nginx site config from template using EMENU_BASE_DOMAIN from .env
# Usage: ./deploy/scripts/render-nginx-config.sh [http|ssl]

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

MODE="${1:-http}"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DOMAIN="${EMENU_BASE_DOMAIN:-emenu.com}"
ACTIVE_DIR="$ROOT_DIR/deploy/nginx/conf.d/active"
TEMPLATE_HTTP="$ROOT_DIR/deploy/nginx/conf.d/emenu-http.conf"
TEMPLATE_SSL="$ROOT_DIR/deploy/nginx/conf.d/emenu-ssl.conf.template"

mkdir -p "$ACTIVE_DIR"
rm -f "$ACTIVE_DIR"/*.conf

export EMENU_BASE_DOMAIN="$DOMAIN"

if [ "$MODE" = "ssl" ]; then
  if ! command -v envsubst >/dev/null 2>&1; then
    echo "envsubst not found. Install gettext-base (apt) or gettext (brew)."
    exit 1
  fi
  envsubst '${EMENU_BASE_DOMAIN}' < "$TEMPLATE_SSL" > "$ACTIVE_DIR/emenu.conf"
  echo "Rendered SSL config for $DOMAIN -> $ACTIVE_DIR/emenu.conf"
else
  if command -v envsubst >/dev/null 2>&1; then
    envsubst '${EMENU_BASE_DOMAIN}' < "$TEMPLATE_HTTP" > "$ACTIVE_DIR/emenu.conf"
  else
    sed "s/\${EMENU_BASE_DOMAIN}/$DOMAIN/g" "$TEMPLATE_HTTP" > "$ACTIVE_DIR/emenu.conf"
  fi
  echo "Rendered HTTP config for $DOMAIN -> $ACTIVE_DIR/emenu.conf"
fi
