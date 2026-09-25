from django.db import models
from django.core.exceptions import PermissionDenied

from .tenancy import get_current_tenant


class TenantQuerySet(models.QuerySet):
    """Auto-filter by current tenant when set."""

    tenant_field = 'tenant'

    def for_tenant(self, tenant):
        if tenant is None:
            return self.none()
        return self.filter(**{self.tenant_field: tenant})

    def _apply_tenant_scope(self):
        tenant = get_current_tenant()
        if tenant is not None:
            return self.filter(**{self.tenant_field: tenant})
        return self

    def all(self):
        return self._apply_tenant_scope()


class TenantManager(models.Manager.from_queryset(TenantQuerySet)):
    pass


class TenantAwareModel(models.Model):
    """
    Abstract base: direct FK to Restaurant (tenant) with indexed tenant_id column.
    """
    tenant = models.ForeignKey(
        'menu.Restaurant',
        on_delete=models.CASCADE,
        db_column='tenant_id',
        db_index=True,
        related_name='%(class)s_set',
        verbose_name='المطعم (Tenant)',
    )

    objects = TenantManager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.tenant_id:
            current = get_current_tenant()
            if current:
                self.tenant = current
        super().save(*args, **kwargs)


def tenant_scoped_queryset(model, user, qs=None):
    """
    Admin/API queryset scoping:
    - Superuser: all rows (optionally filtered by current tenant context)
    - Owner: only their tenant(s)
    - Anonymous + tenant context: scoped to that tenant
    """
    if qs is None:
        qs = model.objects.all()

    if user.is_superuser:
        tenant = get_current_tenant()
        if tenant and hasattr(model, 'tenant'):
            return qs.filter(tenant=tenant)
        return qs

    if user.is_authenticated:
        field = 'tenant' if hasattr(model, 'tenant') else None
        if field:
            return qs.filter(**{f'{field}__owner': user})
        if hasattr(model, 'category'):
            return qs.filter(category__tenant__owner=user)
        if hasattr(model, 'item'):
            return qs.filter(item__tenant__owner=user)

    tenant = get_current_tenant()
    if tenant and hasattr(model, 'tenant'):
        return qs.filter(tenant=tenant)

    return qs.none()


def assert_tenant_access(user, tenant) -> None:
    if user.is_superuser:
        return
    if tenant.owner_id != user.id:
        raise PermissionDenied('You do not have access to this tenant.')
