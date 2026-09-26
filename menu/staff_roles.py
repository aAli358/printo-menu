"""Resolve tenant role for RBAC (owner + RestaurantStaff)."""
from .models import Restaurant, RestaurantStaff


def resolve_user_tenant_role(user, tenant: Restaurant | None) -> str | None:
    if not user or not user.is_authenticated or not tenant:
        return None
    if user.is_superuser or tenant.owner_id == user.id:
        return 'owner'
    staff = RestaurantStaff.objects.filter(tenant=tenant, user=user).first()
    return staff.role if staff else None


def user_can_access_tenant(user, tenant: Restaurant) -> bool:
    return resolve_user_tenant_role(user, tenant) is not None
