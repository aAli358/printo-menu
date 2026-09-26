import os
import sys
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

TESTING = 'test' in sys.argv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-e%g@u6=o(c$3@+22dmucutg9zely^mth*duo=1&8p!3)#_+sb0')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
# Leading dot (e.g. .printo-menu.com) allows all tenant subdomains in Django.
ALLOWED_HOSTS = [h.strip() for h in os.environ.get('ALLOWED_HOSTS', '*').split(',') if h.strip()]
EMENU_BASE_DOMAIN = os.environ.get('EMENU_BASE_DOMAIN', 'localhost:5173')
AUTH_HANDOFF_TTL_SECONDS = int(os.environ.get('AUTH_HANDOFF_TTL_SECONDS', '120'))
REDIS_URL = os.environ.get('REDIS_URL', '')

ASGI_APPLICATION = 'core.asgi.application'

if REDIS_URL:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {'hosts': [REDIS_URL]},
        },
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }

# Email — console backend in DEBUG, SMTP in production (configure via env)
EMAIL_BACKEND = os.environ.get(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend' if DEBUG else 'django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'E-Menu Pro <noreply@emenu.local>')
ADMIN_CONTACT_EMAIL = os.environ.get('ADMIN_CONTACT_EMAIL', 'admin@emenu.local')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
    ),
    'EXCEPTION_HANDLER': 'core.exceptions.global_exception_handler',
}

CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173',
    ).split(',') if o.strip()
]
CORS_ALLOW_CREDENTIALS = True

_cors_regex_env = os.environ.get('CORS_ALLOWED_ORIGIN_REGEXES', '')
if _cors_regex_env:
    CORS_ALLOWED_ORIGIN_REGEXES = [r.strip() for r in _cors_regex_env.split(',') if r.strip()]
elif DEBUG:
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r'^http://[\w-]+\.localhost(:\d+)?$',
        r'^http://192\.168\.\d+\.\d+(:\d+)?$',
        r'^http://10\.\d+\.\d+\.\d+(:\d+)?$',
        r'^http://172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$',
    ]

INSTALLED_APPS = [
    "daphne",
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "unfold.contrib.import_export",
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'django_filters',
    'channels',
    'menu',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'menu.middleware.TenantMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        ssl_require=os.environ.get('DATABASE_SSL_REQUIRE', 'False') == 'True',
    )
}

LANGUAGE_CODE = 'ar'
TIME_ZONE = 'Asia/Riyadh'
USE_I18N = True
USE_TZ = True

LANGUAGES = [
    ('ar', 'Arabic'),
    ('en', 'English'),
]

LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

STATICFILES_DIRS = [BASE_DIR / 'static']

from django.templatetags.static import static

# Unfold Enterprise Admin Configuration
UNFOLD = {
    "SITE_TITLE": "E-Menu Pro",
    "SITE_HEADER": "E-Menu",
    "SITE_SUBHEADER": "منصة إدارة المنيو الذكية",
    "SITE_SYMBOL": "restaurant_menu",
    "SITE_URL": "/",
    "DASHBOARD_CALLBACK": "menu.dashboard.dashboard_callback",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "ENVIRONMENT": "menu.dashboard.environment_callback",
    "STYLES": [
        lambda request: static("admin/css/emenu-admin.css"),
        lambda request: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Tajawal:wght@400;500;700;800;900&display=swap",
        lambda request: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",
    ],
    "COLORS": {
        "primary": {
            "50": "238 242 255",
            "100": "224 231 255",
            "200": "199 210 254",
            "300": "165 180 252",
            "400": "129 140 248",
            "500": "99 102 241",
            "600": "79 70 229",
            "700": "67 56 202",
            "800": "55 48 163",
            "900": "49 46 129",
            "950": "30 27 75",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "لوحة القيادة",
                "separator": True,
                "items": [
                    {"title": "نظرة عامة", "icon": "dashboard", "link": "/admin/"},
                    {"title": "معاينة المنيو", "icon": "open_in_new", "link": "http://localhost:5173/"},
                ],
            },
            {
                "title": "إدارة العمل",
                "separator": True,
                "items": [
                    {"title": "المطاعم", "icon": "storefront", "link": "/admin/menu/restaurant/"},
                    {"title": "ساعات العمل", "icon": "schedule", "link": "/admin/menu/openinghours/"},
                ],
            },
            {
                "title": "المنيو الرقمي",
                "separator": True,
                "items": [
                    {"title": "الأصناف", "icon": "lunch_dining", "link": "/admin/menu/menuitem/"},
                    {"title": "الأقسام", "icon": "grid_view", "link": "/admin/menu/category/"},
                    {"title": "الإضافات", "icon": "tune", "link": "/admin/menu/addongroup/"},
                ],
            },
            {
                "title": "المبيعات والعملاء",
                "separator": True,
                "items": [
                    {"title": "الطلبات", "icon": "receipt_long", "link": "/admin/menu/order/"},
                    {"title": "طلبات النادل", "icon": "notifications_active", "link": "/admin/menu/tablecall/"},
                    {"title": "التقييمات", "icon": "star", "link": "/admin/menu/menuitemreview/"},
                ],
            },
        ],
    },
    "TABS": [
        {
            "models": ["menu.restaurant"],
            "items": [
                {"title": "المطاعم", "link": "/admin/menu/restaurant/"},
                {"title": "إضافة مطعم", "link": "/admin/menu/restaurant/add/"},
            ],
        },
    ],
}

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Production / HTTPS (behind Nginx reverse proxy) ---
_csrf_origins = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
if _csrf_origins:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins.split(',') if o.strip()]

_csrf_domain = os.environ.get('CSRF_COOKIE_DOMAIN')
if _csrf_domain:
    CSRF_COOKIE_DOMAIN = _csrf_domain

_session_domain = os.environ.get('SESSION_COOKIE_DOMAIN')
if _session_domain:
    SESSION_COOKIE_DOMAIN = _session_domain

if not DEBUG and not TESTING:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True'
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = os.environ.get('SECURE_HSTS_PRELOAD', 'False') == 'True'
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'SAMEORIGIN'
