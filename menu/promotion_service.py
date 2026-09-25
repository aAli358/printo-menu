"""Promotion eligibility and order discount calculation."""
from __future__ import annotations

from django.utils import timezone

from .models import Promotion


def _promo_discount_amount(promo: Promotion, base_amount: float) -> float:
    if base_amount <= 0:
        return 0.0
    if promo.discount_percent:
        return base_amount * float(promo.discount_percent) / 100
    if promo.discount_amount:
        return min(float(promo.discount_amount), base_amount)
    return 0.0


def is_promo_active(promo: Promotion, now=None) -> bool:
    now = now or timezone.now()
    if not promo.is_active:
        return False
    if promo.valid_from and promo.valid_from > now:
        return False
    if promo.valid_until and promo.valid_until < now:
        return False
    if promo.promo_type == 'happy_hour':
        current_time = now.time()
        if promo.start_time and promo.end_time:
            if promo.start_time <= promo.end_time:
                if not (promo.start_time <= current_time <= promo.end_time):
                    return False
            elif not (current_time >= promo.start_time or current_time <= promo.end_time):
                return False
        if promo.days_of_week and now.weekday() not in promo.days_of_week:
            return False
    return True


def get_active_promotions(tenant, now=None):
    now = now or timezone.now()
    promos = Promotion.objects.filter(tenant=tenant, is_active=True).select_related('category')
    return [p for p in promos if is_promo_active(p, now)]


def calculate_order_discount(tenant, order_items, coupon_code: str = '') -> tuple[float, str]:
    """
    order_items: list of dicts with keys menu_item (MenuItem), quantity (int), price (float)
    Returns (discount_amount, coupon_code_applied).
    """
    subtotal = sum(float(item['price']) * int(item['quantity']) for item in order_items)
    if subtotal <= 0:
        return 0.0, ''

    active = get_active_promotions(tenant)
    discount = 0.0
    applied_coupon = ''

    for promo in active:
        if promo.promo_type == 'category_discount' and promo.category_id:
            cat_total = sum(
                float(item['price']) * int(item['quantity'])
                for item in order_items
                if item['menu_item'].category_id == promo.category_id
            )
            discount += _promo_discount_amount(promo, cat_total)

    for promo in active:
        if promo.promo_type != 'buy_x_get_y' or not promo.buy_quantity or not promo.get_quantity:
            continue
        applicable = [
            item for item in order_items
            if not promo.category_id or item['menu_item'].category_id == promo.category_id
        ]
        units: list[float] = []
        for item in applicable:
            units.extend([float(item['price'])] * int(item['quantity']))
        units.sort()
        bundle = promo.buy_quantity + promo.get_quantity
        if bundle > 0 and units:
            free_count = (len(units) // bundle) * promo.get_quantity
            discount += sum(units[:free_count])

    for promo in active:
        if promo.promo_type == 'happy_hour':
            discount += _promo_discount_amount(promo, subtotal)

    coupon_code = (coupon_code or '').strip()
    if coupon_code:
        coupon = next(
            (
                p for p in active
                if p.promo_type == 'coupon' and p.coupon_code.lower() == coupon_code.lower()
            ),
            None,
        )
        if coupon:
            discount += _promo_discount_amount(coupon, subtotal)
            applied_coupon = coupon_code

    return min(discount, subtotal), applied_coupon
