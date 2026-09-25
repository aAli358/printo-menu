# E-Menu — Full System & Security Audit Report

**Date:** 2026-08-16  
**Scope:** Backend security, DB performance, Frontend UX, Docker deployment  
**Status:** Critical/High issues **fixed** in this pass; remaining items documented below.

---

## Executive Summary

| Area | Critical | High | Medium | Fixed now |
|------|----------|------|--------|-----------|
| Backend & Security | 2 | 4 | 6 | 6 |
| DB & Performance | 0 | 4 | 3 | 4 |
| Frontend & UX | 0 | 3 | 5 | 4 |
| Deployment | 2 | 2 | 4 | 3 |

**Verdict:** Safe for staged launch after reviewing remaining MEDIUM/LOW items. Run `./deploy/scripts/setup-ssl.sh` before enabling `SECURE_SSL_REDIRECT=True`.

---

## 1. Backend & Security

### CRITICAL (fixed)

| Issue | Risk | Fix applied |
|-------|------|-------------|
| Public **orders** accepted without tenant context | Spam / cross-tenant order injection | `validate_public_tenant_match()` now **fail-closed** — requires subdomain, `X-Tenant-Slug`, or `?r=` |
| **Reviews** list exposed all tenants | Data leak / IDOR read | `MenuItemReviewViewSet.get_queryset()` scoped to current tenant |
| Client-controlled **order prices** | Revenue fraud | Server uses `menu_item.base_price` only |
| **Table calls** without tenant context | Cross-tenant abuse | Same fail-closed validation on create |

### HIGH (fixed / partial)

| Issue | Status |
|-------|--------|
| `OrderSerializer` / `TableCallSerializer` accepted any restaurant PK | **Fixed** — queryset scoped to active tenant |
| `Restaurant` list dumped full nested menus | **Fixed** — `RestaurantListSerializer` for list action |
| `MenuItem` category change across tenants | **Fixed** — validation in `MenuItemWriteSerializer` |
| `PlatformSettings` admin open to all staff | **Fixed** — `SuperAdminOnlyMixin` |
| Superuser full bypass | **Accepted** — document; restrict superuser accounts in production |

### MEDIUM (open — monitor)

- JWT in URL hash (`#session=`) during cross-subdomain login — tokens in history/referrer. **Mitigation for v2:** postMessage or server-side exchange.
- Auth tokens in `localStorage` — standard SPA XSS surface.
- No automated tenant-isolation tests in `menu/tests.py`.
- Django admin: `Addon` / `AddonGroup` not tenant-scoped in admin.

---

## 2. Database & Performance

### HIGH (fixed)

| Endpoint | Before | After |
|----------|--------|-------|
| `GET .../public_menu/` | 100+ queries (N+1) | ~6–8 via `prefetch_related` + `Avg` annotation |
| `CategoryViewSet` list | N+1 on items/variants/addons | Prefetch + annotate |
| `MenuItemViewSet` list | N+1 | `select_related` + prefetch |
| `OrderViewSet` kitchen/live | N+1 on items | `orders_for_kitchen_qs()` |

**New file:** `menu/querysets.py` — shared prefetch helpers.

### Indexes

| Field | Status |
|-------|--------|
| `tenant_id` on scoped models | `db_index=True` on FKs ✓ |
| `(tenant, is_available)` MenuItem | ✓ |
| `(tenant, status)` Order | ✓ |
| `slug` Restaurant | Unique index (redundant explicit index — cosmetic) |
| `(tenant, is_active, order)` Category | **Recommended** — add in future migration |

---

## 3. Frontend & UX

### Build verification

```
npm run build  → PASS (tsc + vite)
python manage.py check → PASS
```

### Fixed

- API error parsing aligned with DRF wrapper (`parseApiError` utility).
- **403 suspended tenant** — user-friendly Arabic/English message.
- **Empty restaurant list** — shows error instead of blank shell.
- **`/kitchen`** protected with `ProtectedRoute` on tenant subdomains.
- Network error copy updated for production (not “Start Backend”).

### Open (MEDIUM/LOW)

- Call waiter failures silent (`CallWaiterButton`).
- TenantDashboard mutations lack try/catch.
- `RatingModal` stub — no API call yet.
- 401 refresh clears session without redirect.

---

## 4. Deployment Readiness

### Fixed

| Issue | Fix |
|-------|-----|
| PostgreSQL SSL required with non-TLS Docker DB | `DATABASE_SSL_REQUIRE=False` in `.env.example`; settings reads env |
| Media 404 when `DEBUG=False` | `core/urls.py` serves `/media/` in production |
| `SECURE_SSL_REDIRECT=True` before certs | Default **False** in `.env.example`; enable after SSL |

### Docker stack status

| Component | Ready |
|-----------|-------|
| `docker-compose.yml` | ✓ db, backend, frontend, nginx, certbot |
| `docker/backend/Dockerfile` + entrypoint | ✓ migrate, collectstatic, gunicorn |
| `frontend/Dockerfile` + nginx SPA | ✓ |
| `deploy/scripts/deploy.sh` | ✓ one-click |
| `deploy/scripts/setup-ssl.sh` | ✓ manual DNS-01 wildcard |
| Edge nginx wildcard routing | ✓ templates + `render-nginx-config.sh` |

### Pre-launch checklist

- [ ] Set strong `SECRET_KEY` and `POSTGRES_PASSWORD`
- [ ] Set `DEBUG=False`
- [ ] Configure SMTP email
- [ ] DNS A + wildcard → VPS IP
- [ ] Run `./deploy/scripts/deploy.sh`
- [ ] Run `./deploy/scripts/setup-ssl.sh`
- [ ] Set `SECURE_SSL_REDIRECT=True` after SSL live
- [ ] Create superuser; avoid granting superuser to tenant owners

---

## 5. Auth & Route Protection Summary

| Route | Protection |
|-------|------------|
| `/admin/` | Django admin auth |
| `/api/v1/auth/*` | Public register/login; JWT for me |
| `/dashboard` | `ProtectedRoute` + JWT |
| `/kitchen` | `ProtectedRoute` + JWT (fixed) |
| Public menu / orders / table-calls | AllowAny + **tenant context required** for writes |

---

## 6. Files changed in this audit pass

- `menu/permissions.py` — fail-closed tenant validation
- `menu/views.py` — security + prefetch optimizations
- `menu/serializers.py` — scoped querysets, list serializer, rating annotation
- `menu/querysets.py` — **new** prefetch helpers
- `menu/admin.py` — superuser-only platform settings
- `core/settings.py` — configurable DB SSL
- `core/urls.py` — production media serving
- `.env.example` — SSL flags
- `frontend/src/utils/apiErrors.ts` — **new**
- `frontend/src/App.tsx`, `CustomerMenuApp.tsx`, `LoginPage.tsx`, `LandingPage.tsx`

---

## 7. Recommended next sprint

1. Tenant isolation integration tests (`pytest` / DRF APITestCase).
2. Replace JWT-in-hash with secure cross-subdomain handoff.
3. Wire `RatingModal` to reviews API.
4. Add backend healthcheck in `docker-compose.yml`.
5. Composite index migration for `Category(tenant, is_active, order)`.

---

*Report generated after automated exploration + manual fixes. Re-run `npm run build` and `manage.py check` before each release.*
