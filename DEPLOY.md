# E-Menu — Production Deployment

Deploy the full stack (PostgreSQL, Django/Gunicorn, React/Nginx, edge Nginx, Certbot) on a Linux VPS with one command.

## Prerequisites

- Linux VPS (Ubuntu 22.04+ recommended) with Docker Engine and Docker Compose v2
- Domain name (e.g. `emenu.com`) with DNS access
- Ports **80** and **443** open on the firewall

## Quick start (one click)

```bash
git clone <your-repo> emenu && cd emenu
cp .env.example .env
# Edit .env: SECRET_KEY, POSTGRES_PASSWORD, EMENU_BASE_DOMAIN, email settings

chmod +x deploy/scripts/*.sh docker/backend/entrypoint.sh
./deploy/scripts/deploy.sh
```

## DNS setup

| Record | Type | Value |
|--------|------|-------|
| `@` | A | Your VPS IP |
| `*` | A | Your VPS IP |

This enables the landing page on `emenu.com` and tenant subdomains like `shams.emenu.com`.

## Environment variables

Copy `.env.example` to `.env`. Key values:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret (generate a random string) |
| `POSTGRES_PASSWORD` | Database password |
| `EMENU_BASE_DOMAIN` | Root domain without protocol (e.g. `emenu.com`) |
| `DATABASE_URL` | Auto-set in docker-compose; uses PostgreSQL |
| `ALLOWED_HOSTS` | Include `.emenu.com,emenu.com` |
| `CSRF_TRUSTED_ORIGINS` | `https://emenu.com,https://www.emenu.com` |
| `CORS_ALLOWED_ORIGIN_REGEXES` | `^https://[\w-]+\.emenu\.com$` |

Local development still uses SQLite when `DATABASE_URL` is unset and `DEBUG=True`.

## Architecture

```
Internet → Nginx (edge) → /api/, /admin/, /media/ → Django (Gunicorn)
                        → /                       → React (Nginx static)
                        → PostgreSQL (internal)
```

## SSL (wildcard HTTPS)

After DNS propagates:

```bash
./deploy/scripts/setup-ssl.sh
```

Uses Let's Encrypt **DNS-01** challenge for `emenu.com` and `*.emenu.com`. Follow Certbot prompts to add `_acme-challenge` TXT records at your DNS provider.

Certbot container auto-renews every 12 hours.

## Useful commands

```bash
# View logs
docker compose logs -f

# Create Django superuser
docker compose exec backend python manage.py createsuperuser

# Rebuild after code changes
docker compose build && docker compose up -d

# Switch Nginx config manually
./deploy/scripts/render-nginx-config.sh http   # or ssl
docker compose exec nginx nginx -s reload
```

## File layout

```
docker/
  backend/Dockerfile      # Django + Gunicorn
  backend/entrypoint.sh # migrate, collectstatic, gunicorn
frontend/
  Dockerfile              # Vite build + Nginx
  nginx.conf              # SPA routing
deploy/
  gunicorn.conf.py
  nginx/nginx.conf        # Edge nginx main config
  nginx/conf.d/           # HTTP/SSL templates
  scripts/deploy.sh       # One-click deploy
  scripts/setup-ssl.sh    # Wildcard certbot
  scripts/render-nginx-config.sh
docker-compose.yml
.env.example
```

## Production checklist

- [ ] Change `SECRET_KEY` and `POSTGRES_PASSWORD`
- [ ] Set `DEBUG=False`
- [ ] Configure SMTP email variables
- [ ] Point DNS A records (root + wildcard)
- [ ] Run `./deploy/scripts/deploy.sh`
- [ ] Create superuser
- [ ] Run `./deploy/scripts/setup-ssl.sh`
- [ ] Register a test tenant from the landing page
