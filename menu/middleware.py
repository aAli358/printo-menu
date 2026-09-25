from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

from .models import Restaurant
from .tenancy import clear_current_tenant, resolve_tenant_slug, set_current_tenant


class TenantMiddleware(MiddlewareMixin):
    """
    Resolves the current tenant (Restaurant) per request and stores it in thread-local.
    Supports priority: X-Tenant-Slug header > subdomain > ?r= query > /r/{slug}/ path.
    """

    PUBLIC_PREFIXES = (
        '/admin/',
        '/static/',
        '/media/',
        '/i18n/',
    )

    def process_request(self, request):
        clear_current_tenant()

        if any(request.path.startswith(p) for p in self.PUBLIC_PREFIXES):
            return None

        slug = resolve_tenant_slug(request)
        if not slug:
            return None

        try:
            tenant = Restaurant.objects.get(slug=slug, is_active=True)
        except Restaurant.DoesNotExist:
            if request.path.startswith('/api/'):
                return JsonResponse(
                    {'detail': f'Tenant "{slug}" not found or inactive.', 'code': 'tenant_not_found'},
                    status=404,
                )
            return None

        if tenant.subscription_status == 'suspended' and not request.user.is_superuser:
            if request.path.startswith('/api/'):
                return JsonResponse(
                    {'detail': 'This restaurant subscription is suspended.', 'code': 'tenant_suspended'},
                    status=403,
                )

        set_current_tenant(tenant)
        request.tenant = tenant
        return None

    def process_response(self, request, response):
        clear_current_tenant()
        return response

    def process_exception(self, request, exception):
        clear_current_tenant()
        return None
