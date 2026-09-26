from django.db.models import Q

from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import Restaurant, RestaurantStaff
from .tenancy import get_current_tenant


def get_user_tenants(user):
    if not user or not user.is_authenticated:
        return Restaurant.objects.none()
    if user.is_superuser:
        return Restaurant.objects.all()
    staff_ids = RestaurantStaff.objects.filter(user=user).values_list('tenant_id', flat=True)
    return Restaurant.objects.filter(Q(owner=user) | Q(pk__in=staff_ids)).distinct()


def user_has_tenant_access(user, tenant_id: int) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    if Restaurant.objects.filter(pk=tenant_id, owner=user).exists():
        return True
    return RestaurantStaff.objects.filter(tenant_id=tenant_id, user=user).exists()


def get_user_primary_tenant(user):
    return get_user_tenants(user).first()


def object_belongs_to_user(user, obj) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    if hasattr(obj, 'tenant_id') and obj.tenant_id:
        return user_has_tenant_access(user, obj.tenant_id)
    if hasattr(obj, 'owner_id'):
        return obj.owner_id == user.id
    if hasattr(obj, 'category_id') and obj.category_id:
        return user_has_tenant_access(user, obj.category.tenant_id)
    if hasattr(obj, 'item_id') and obj.item_id:
        return user_has_tenant_access(user, obj.item.tenant_id)
    return False


class IsTenantOwnerOrReadOnly(BasePermission):
    """Authenticated tenant owners may write; everyone may read public data."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return object_belongs_to_user(request.user, obj)


class IsTenantOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return object_belongs_to_user(request.user, obj)


class IsRestaurantOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        return obj.owner_id == request.user.id


def validate_tenant_write_access(user, tenant) -> None:
    from rest_framework.exceptions import PermissionDenied
    if user.is_superuser:
        return
    if tenant.owner_id == user.id:
        return
    if RestaurantStaff.objects.filter(tenant=tenant, user=user).exists():
        return
    raise PermissionDenied('You do not have access to this tenant.')


def validate_public_tenant_match(tenant, request) -> None:
    """Require resolved tenant context and ensure body matches it (fail closed)."""
    from rest_framework.exceptions import PermissionDenied
    current = get_current_tenant()
    if not current:
        raise PermissionDenied(
            'Tenant context is required. Use subdomain, X-Tenant-Slug header, or ?r=slug.'
        )
    if tenant.id != current.id:
        raise PermissionDenied('Tenant mismatch for this request.')
