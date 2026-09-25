"""
Multi-tenant context & helpers.
Restaurant model acts as the Tenant (single DB, shared codebase).
"""
from __future__ import annotations

import threading
from typing import TYPE_CHECKING, Optional

from django.conf import settings

if TYPE_CHECKING:
    from menu.models import Restaurant

_state = threading.local()

RESERVED_SUBDOMAINS = frozenset({
    'www', 'admin', 'api', 'app', 'dashboard', 'kitchen', 'login', 'static', 'media',
})


def get_current_tenant() -> Optional['Restaurant']:
    return getattr(_state, 'tenant', None)


def set_current_tenant(tenant: Optional['Restaurant']) -> None:
    _state.tenant = tenant


def clear_current_tenant() -> None:
    if hasattr(_state, 'tenant'):
        del _state.tenant


def extract_subdomain_slug(host: str) -> Optional[str]:
    """
    Extract tenant slug from host:
    - shams.localhost -> shams
    - shams.emenu.com -> shams
    """
    host = host.split(':')[0].lower().strip('.')
    if not host or host in ('localhost', '127.0.0.1'):
        return None

    segments = host.split('.')
    if len(segments) < 2:
        return None

    tld = segments[-1]
    slug = segments[0]

    if slug in RESERVED_SUBDOMAINS:
        return None

    # slug.localhost or slug.local (dev)
    if tld in ('localhost', 'local', 'test'):
        return slug

    # slug.example.com (production — at least 3 segments)
    if len(segments) >= 3:
        return slug

    return None


def resolve_tenant_slug(request) -> Optional[str]:
    """Resolve tenant slug: header > custom domain > subdomain > query > path."""
    meta = request.META

    header_slug = meta.get('HTTP_X_TENANT_SLUG') or meta.get('HTTP_X_RESTAURANT_SLUG')
    if header_slug:
        return header_slug.strip().lower()

    host = meta.get('HTTP_HOST', '').split(':')[0].lower().strip('.')
    if host:
        from menu.models import Restaurant
        custom = Restaurant.objects.filter(custom_domain=host, is_active=True).values_list('slug', flat=True).first()
        if custom:
            return custom

    subdomain = extract_subdomain_slug(meta.get('HTTP_HOST', ''))
    if subdomain:
        return subdomain

    for key in ('r', 'tenant', 'restaurant'):
        value = request.GET.get(key)
        if value:
            return value.strip().lower()

    path = request.path.strip('/')
    parts = path.split('/')
    for i, part in enumerate(parts):
        if part == 'r' and i + 1 < len(parts):
            return parts[i + 1].lower()

    return None


def get_base_domain() -> str:
    return getattr(settings, 'EMENU_BASE_DOMAIN', 'localhost:5173')
