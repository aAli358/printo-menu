from .models import PlatformSettings, Restaurant


def _branding_payload(settings: PlatformSettings, request=None) -> dict:
    logo_url = settings.platform_logo_url.strip()
    if request and logo_url and logo_url.startswith('/'):
        logo_url = request.build_absolute_uri(logo_url)
    return {
        'show': True,
        'name': settings.platform_name,
        'logo_url': logo_url,
        'website_url': settings.platform_website_url.strip(),
    }


def build_public_platform_branding(request=None) -> dict | None:
    """Landing page / global footer — no tenant context."""
    settings = PlatformSettings.load()
    if not settings.show_platform_branding:
        return None
    website = settings.platform_website_url.strip()
    if not website:
        return None
    return _branding_payload(settings, request)


def build_platform_branding(restaurant: Restaurant, request=None) -> dict | None:
    """Customer menu footer — respects enterprise hide flag."""
    settings = PlatformSettings.load()
    if not settings.show_platform_branding:
        return None
    if restaurant.hide_platform_branding:
        return None
    website = settings.platform_website_url.strip()
    if not website:
        return None
    return _branding_payload(settings, request)