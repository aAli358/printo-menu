# تقرير جاهزية الإطلاق (Production Readiness Audit)

**المنصة:** E-Menu Pro (SaaS Multi-Tenant — منيو برنتو / Bronto)  
**التاريخ:** 25 سبتمبر 2026  
**الهدف:** Contabo VPS — إطلاق إنتاجي  
**الحكم العام:** ✅ **جاهز للإطلاق** مع checklist `.env` و DNS (انظر §8)

---

## ملخص تنفيذي

| المجال | الحالة | الملاحظة |
|--------|--------|----------|
| 1. Backend & Multi-Tenancy | ✅ | 13/13 tests، عزل tenant مُختبر |
| 2. الأمان (Production settings) | ✅ | مُفعّل عند `DEBUG=False`؛ تحذيران اختياريان HSTS |
| 3. Query optimization (N+1) | ✅ | `querysets.py` + prefetch للمنيو والمطبخ |
| 4. Docker / Deploy | ✅ | `docker-compose.yml` + **`docker-compose.prod.yml`** |
| 5. Frontend build | ✅ | `npm run build` بدون أخطاء |
| 6. الثيمات | ✅ **10 ثيمات** (ليس 14 — انظر §5) |

**إصلاحات أُنجزت أثناء هذا الفحص:**
- تعطيل `SECURE_SSL_REDIRECT` أثناء `manage.py test` (منع 301 في الاختبارات).
- حذف `menu/tests.py` الفارغ (تعارض مع package `menu/tests/`).
- إضافة `docker-compose.prod.yml` لـ Contabo (`DEBUG=False` على backend).

---

## 1. اختبارات Backend والعزل (Django & Multi-Tenancy)

### 1.1 تشغيل الاختبارات

```text
python manage.py test menu.tests   → 13/13 OK
python manage.py test              → 13/13 OK (بعد إصلاح tests.py)
python manage.py makemigrations --check --dry-run → No changes detected
```

**الاختبارات تشمل:**
- عزل الأقسام بين مالكين (`TenantIsolationTests`)
- Auth handoff (cross-subdomain)
- Health + Barcode
- Promotions (happy hour logic, coupon, line price)
- حجز عام + register superuser flag

### 1.2 Tenant Isolation Audit (مراجعة كود)

| آلية | الملف | الوظيفة |
|------|-------|---------|
| Middleware | `menu/middleware.py` | `TenantMiddleware` — `request.tenant` |
| Scoped queries | `menu/managers.py` | `tenant_scoped_queryset()` |
| Public writes | `menu/permissions.py` | `validate_public_tenant_match()` |
| Admin | `menu/admin_tenancy.py` | فلترة حسب المالك |
| Slug resolution | `menu/tenancy.py` | subdomain + custom domain + headers |

**النتيجة:** لا ثغرة واضحة cross-tenant في مسارات الكتابة العامة المُختبرة؛ الكتابة تتطلب تطابق tenant context مع body.

### 1.3 الأمان — `DEBUG=False` و HTTPS

**الملف:** `core/settings.py`

| الإعداد | السلوك عند الإنتاج |
|---------|---------------------|
| `DEBUG=False` | يُفعّل SSL cookies + HSTS + `SECURE_SSL_REDIRECT` (افتراضي True) |
| `ALLOWED_HOSTS` | من `.env` — مثال: `.emenu.com,emenu.com` (wildcard leading dot) |
| `CSRF_TRUSTED_ORIGINS` | من `.env` — `https://emenu.com,...` |
| `CSRF_COOKIE_DOMAIN` / `SESSION_COOKIE_DOMAIN` | `.emenu.com` للـ subdomains |
| `CORS_ALLOWED_ORIGIN_REGEXES` | `^https://[\w-]+\.emenu\.com$` |
| `SECURE_PROXY_SSL_HEADER` | `X-Forwarded-Proto` (خلف Nginx) |

```bash
python manage.py check --deploy
# WARNINGS فقط (اختياري):
# W019 X_FRAME_OPTIONS=SAMEORIGIN (مقصود للـ Admin/embed)
# W021 SECURE_HSTS_PRELOAD=False (فعّله بعد استقرار SSL)
```

**⚠️ Contabo — قبل Go-Live:**
- `SECRET_KEY` عشوائي ≥50 حرف (ليس `change-me...` ولا `django-insecure-...`)
- `POSTGRES_PASSWORD` قوي
- `DEBUG=False` في `.env`

---

## 2. تحسين الأداء وقاعدة البيانات (N+1)

### 2.1 المنيو العام (`public_menu`)

**الملف:** `menu/querysets.py`

```text
restaurant_with_menu_prefetch()
  → categories (prefetch)
    → items (prefetch variants + addon_groups → addons)
    → annotate avg_rating
```

**الملف:** `menu/views.py` — `public_menu` يستخدم `restaurant_with_menu_prefetch`.

**النتيجة:** ✅ لا N+1 واضح على مسار المنيو الرئيسي.

### 2.2 المطبخ والطلبات

- `orders_for_kitchen_qs`: `select_related('tenant')` + `prefetch items → menu_item`
- Promotions: `select_related('category')`

### 2.3 PostgreSQL على Contabo

- استخدم **PostgreSQL 16** (Docker) — لا SQLite في الإنتاج.
- `conn_max_age=600` في `DATABASE_URL`.
- Volume `postgres_data` للثبات؛ `media_data` للصور.

**توصية لاحقة (ليست blocker):** Redis cache للـ `public_menu` hot tenants.

---

## 3. Docker و Production Scripts

### 3.1 الملفات

| الملف | الحالة |
|-------|--------|
| `docker-compose.yml` | ✅ Stack كامل |
| **`docker-compose.prod.yml`** | ✅ **أُضيف** — `DEBUG=False` على backend |
| `docker/backend/Dockerfile` | ✅ Python 3.11, media/static dirs |
| `docker/backend/entrypoint.sh` | migrate + collectstatic + **Daphne** (ASGI/WebSocket) |

**ملاحظة:** يوجد `deploy/gunicorn.conf.py` لكن **الإنتاج الحالي يشغّل Daphne** (مطلوب لـ `/ws/kitchen/`). هذا **أفضل** من Gunicorn-only للمطبخ.

### 3.2 الخدمات والربط

```text
Internet → nginx:80/443
  → /api/, /admin/, /static/, /media/, /ws/ → backend:8000 (Daphne)
  → / → frontend:80 (Vite build static)
db:5432 ← backend
redis:6379 ← backend (CHANNEL_LAYERS)
```

### 3.3 Static & Media

| النوع | المسار | التخزين |
|-------|--------|---------|
| Static (Admin/DRF) | `/static/` | `collectstatic` → WhiteNoise + Nginx proxy |
| Media (logo, أصnaف) | `/media/` | Volume **`media_data:/app/media`** |

### 3.4 سكربتات الرفع

| السكربت | الغرض | Contabo |
|---------|-------|---------|
| `./deploy/scripts/deploy.sh` | build + up + migrate | ✅ Linux/bash |
| `./deploy/scripts/setup-ssl.sh` | Wildcard SSL (DNS-01) | ✅ بعد DNS |
| `./deploy/scripts/render-nginx-config.sh` | HTTP/HTTPS nginx | ✅ |

**Windows:** السكربتات **bash** — شغّلها على **Contabo Ubuntu**، مو محلياً.

**أمر Contabo مقترح:**

```bash
cp .env.example .env   # عدّل القيم
chmod +x deploy/scripts/*.sh docker/backend/entrypoint.sh
./deploy/scripts/deploy.sh
# أو:
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 4. Frontend والثيمات

### 4.1 Build

```text
npm run build → ✓ built (0 TypeScript errors)
```

تحذير حجم chunk ~674 KB — **ليس فشل build**؛ تحسين اختياري.

### 4.2 عدد الثيمات

| المتوقع في الطلب | الواقع في الكود |
|------------------|-----------------|
| 14 ثيم | **10 ثيمات** في `frontend/src/themes/index.ts` + `Restaurant.MENU_THEMES` |

**QA:** `scripts/qa_themes.py` → **10/10 OK**  
Dashboard branding: **10 ثيمات** من `MENU_THEMES`.

### 4.3 Subdomain / Tenant

- الثيم يُقرأ من API `public_menu.menu_theme` → `applyThemeToDocument()`.
- `data-menu-theme` على `<html>`.
- QA HTTP + Playwright (عند تثبيت Chromium): **10/10**.

---

## 5. QA Automation (تشغيل هذا الفحص)

```powershell
python manage.py test
python scripts/qa_api_smoke.py      # 12/12
python scripts/qa_themes.py         # 10/10
python scripts/qa_frontend.py
cd frontend && npm run build
```

---

## 6. مخاطر متبقية (Non-Blockers)

| # | البند | الخطورة | إجراء |
|---|-------|---------|-------|
| 1 | SECRET_KEY default في dev | 🔴 إنتاج فقط | `.env` على Contabo |
| 2 | `ALLOWED_HOSTS=*` في dev | 🔴 إنتاج فقط | `.env` محدد |
| 3 | HSTS Preload | 🟡 | `SECURE_HSTS_PRELOAD=True` لاحقاً |
| 4 | X_FRAME SAMEORIGIN | 🟡 | مقصود؛ Admin |
| 5 | JS bundle size | 🟡 | code-split لاحقاً |
| 6 | لا دفع إلكتروني | ℹ️ | by design |

---

## 7. Checklist Go-Live — Contabo

### DNS
- [ ] `A` → `@` → IP Contabo
- [ ] `A` → `www` → IP Contabo
- [ ] `A` → `*` → IP Contabo (wildcard subdomains)

### `.env` (من `.env.example`)
- [ ] `DEBUG=False`
- [ ] `SECRET_KEY=<random 50+>`
- [ ] `ALLOWED_HOSTS=.yourdomain.com,yourdomain.com`
- [ ] `EMENU_BASE_DOMAIN=yourdomain.com`
- [ ] `CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`
- [ ] `CSRF_COOKIE_DOMAIN=.yourdomain.com`
- [ ] `SESSION_COOKIE_DOMAIN=.yourdomain.com`
- [ ] `CORS_ALLOWED_ORIGIN_REGEXES=^https://[\w-]+\.yourdomain\.com$`
- [ ] `POSTGRES_PASSWORD=...`
- [ ] `REDIS_URL=redis://redis:6379/0`
- [ ] `SECURE_SSL_REDIRECT=True`

### بعد الرفع
- [ ] `curl https://yourdomain.com/api/v1/health/` → `{"status":"ok"}`
- [ ] تسجيل مطعm trial + `/dashboard`
- [ ] subdomain `test.yourdomain.com` يفتح المنيو
- [ ] `/kitchen` + WebSocket (Redis شغّال)
- [ ] `./deploy/scripts/setup-ssl.sh`
- [ ] `createsuperuser`
- [ ] نسخ احتياطي `postgres_data` + `media_data`

---

## 8. الحكم النهائي

**✅ المنصة جاهزة للرفع على Contabo** كـ SaaS multi-tenant بعد:

1. ضبط `.env` الإنتاج (§7)  
2. DNS wildcard  
3. SSL  
4. أول superuser + مطعm تجريبي  

**المراجع:** `BRIEF_AR.md`, `CLIENT_DELIVERY_BRIEF_AR.md`, `USER_GUIDE_AR.md`, `QA_REPORT.md`

---

*E-Menu Pro — Production Readiness Audit*
