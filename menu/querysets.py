"""Optimized querysets for menu API endpoints."""

from django.db.models import Avg, Prefetch

from .models import AddonGroup, Category, MenuItem, Order, OrderItem, Restaurant

ACTIVE_TENANT_STATUSES = ['trial', 'active']


def active_restaurants_qs():
    return Restaurant.objects.filter(is_active=True, subscription_status__in=ACTIVE_TENANT_STATUSES)


def menu_items_for_public_qs():
    return (
        MenuItem.objects.filter(is_available=True)
        .order_by('order')
        .prefetch_related(
            'variants',
            Prefetch('addon_groups', queryset=AddonGroup.objects.prefetch_related('addons')),
        )
        .annotate(avg_rating=Avg('reviews__rating'))
    )


def categories_for_public_qs():
    return (
        Category.objects.filter(is_active=True)
        .order_by('order')
        .prefetch_related(Prefetch('items', queryset=menu_items_for_public_qs()))
    )


def restaurant_with_menu_prefetch(qs=None):
    base = qs if qs is not None else Restaurant.objects.all()
    return base.prefetch_related(
        'opening_hours',
        Prefetch('categories', queryset=categories_for_public_qs()),
    )


def orders_for_kitchen_qs(qs):
    return qs.select_related('tenant').prefetch_related(
        Prefetch('items', queryset=OrderItem.objects.select_related('menu_item'))
    )
