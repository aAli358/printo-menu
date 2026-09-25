#!/usr/bin/env bash
# Obtain Let's Encrypt wildcard certificate (*.yourdomain.com) via DNS-01 challenge
# Usage: ./deploy/scripts/setup-ssl.sh
#
# Prerequisites:
#   - deploy.sh already ran (nginx + certbot containers up)
#   - DNS A records for domain and *.domain point to this server
#   - You can add TXT records at your DNS provider (_acme-challenge.yourdomain.com)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "Missing .env — run ./deploy/scripts/deploy.sh first."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

DOMAIN="${CERTBOT_DOMAIN:-${EMENU_BASE_DOMAIN:-emenu.com}}"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"

echo "==> Wildcard SSL for: $DOMAIN and *.$DOMAIN"
echo ""
echo "This uses Certbot DNS-01 (manual). You will be prompted to add TXT records."
echo "Alternative: use your DNS provider's Certbot plugin (Cloudflare, Route53, etc.)"
echo ""

read -r -p "Continue? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  exit 0
fi

docker compose run --rm certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d "$DOMAIN" \
  -d "*.$DOMAIN" \
  --agree-tos \
  --email "$EMAIL" \
  --no-eff-email \
  --manual-public-ip-logging-ok

echo ""
echo "==> Switching Nginx to HTTPS config..."
bash deploy/scripts/render-nginx-config.sh ssl

echo "==> Reloading Nginx..."
docker compose exec nginx nginx -s reload

echo ""
echo "=============================================="
echo " SSL enabled for https://$DOMAIN"
echo "         and https://*.$DOMAIN"
echo ""
echo " Auto-renewal runs in the certbot container."
echo " Test renewal: docker compose run --rm certbot renew --dry-run"
echo "=============================================="
