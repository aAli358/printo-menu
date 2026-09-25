from django.contrib import admin

from .managers import tenant_scoped_queryset
from .models import Restaurant


class TenantAdminMixin:
    """Scope admin querysets: superuser sees all (or current tenant context), owners see their tenants only."""

    tenant_field = 'tenant'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return tenant_scoped_queryset(self.model, request.user, qs)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == self.tenant_field and not request.user.is_superuser:
            kwargs['queryset'] = Restaurant.objects.filter(owner=request.user)
        if db_field.name == 'category' and not request.user.is_superuser:
            kwargs['queryset'] = kwargs.get('queryset', db_field.remote_field.model.objects.all()).filter(
                tenant__owner=request.user,
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if hasattr(obj, self.tenant_field) and not getattr(obj, f'{self.tenant_field}_id'):
            if not request.user.is_superuser:
                owned = Restaurant.objects.filter(owner=request.user).first()
                if owned:
                    setattr(obj, self.tenant_field, owned)
        super().save_model(request, obj, form, change)


class RestaurantOwnerAdminMixin:
    """Restaurant model itself — filter by owner unless superuser."""

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(owner=request.user)

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if not request.user.is_superuser:
            readonly.append('owner')
        return readonly

    def save_model(self, request, obj, form, change):
        if not change and not request.user.is_superuser:
            obj.owner = request.user
        super().save_model(request, obj, form, change)


class MenuItemRelatedAdminMixin:
    """Scope admin querysets to menu items owned by the user's restaurants."""

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(menu_item__tenant__owner=request.user)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        from .models import MenuItem, AddonGroup
        if not request.user.is_superuser:
            if db_field.name == 'menu_item':
                kwargs['queryset'] = MenuItem.objects.filter(tenant__owner=request.user)
            elif db_field.name == 'group':
                kwargs['queryset'] = AddonGroup.objects.filter(menu_item__tenant__owner=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class SuperAdminOnlyMixin:
    def has_module_permission(self, request):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
