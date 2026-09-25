"""Tenant-scoped analytics for REST API."""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Avg, Count, Sum, F, ExpressionWrapper, DurationField
from django.db.models.functions import ExtractHour, TruncDate
from django.utils import timezone

from .models import Order, OrderItem, ExperienceReview, MenuItemReview, Restaurant


def _scope_filter(user):
    if user.is_superuser:
        return {}
    return {'tenant__owner': user}


def build_tenant_analytics(user, period: str = 'week'):
    scope = _scope_filter(user)
    now = timezone.now()
    today = now.date()

    if period == 'day':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'month':
        start = now - timedelta(days=30)
    else:
        start = now - timedelta(days=7)

    orders = Order.objects.filter(**scope)
    completed = orders.filter(status='completed')
    period_orders = orders.filter(created_at__gte=start)
    period_completed = completed.filter(created_at__gte=start)

    revenue = period_completed.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
    order_count = period_orders.count()
    completed_count = period_completed.count()

    sales_by_day = (
        period_completed.annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(revenue=Sum('total_amount'), count=Count('id'))
        .order_by('day')
    )

    best_sellers = (
        OrderItem.objects.filter(order__created_at__gte=start, **scope)
        .values('menu_item__name')
        .annotate(qty=Sum('quantity'), revenue=Sum(F('price') * F('quantity')))
        .order_by('-qty')[:10]
    )

    peak_hours = (
        period_orders.annotate(hour=ExtractHour('created_at'))
        .values('hour')
        .annotate(count=Count('id'))
        .order_by('hour')
    )

    prep_qs = completed.filter(
        preparing_at__isnull=False,
        ready_at__isnull=False,
        created_at__gte=start,
    )
    avg_prep = prep_qs.annotate(
        prep=ExpressionWrapper(F('ready_at') - F('preparing_at'), output_field=DurationField()),
    ).aggregate(avg=Avg('prep'))['avg']
    avg_prep_minutes = round(avg_prep.total_seconds() / 60, 1) if avg_prep else None

    exp_reviews = ExperienceReview.objects.filter(**scope)
    avg_rating = exp_reviews.aggregate(avg=Avg('rating'))['avg']
    recent_reviews = list(
        exp_reviews.order_by('-created_at')[:10].values(
            'id', 'rating', 'comment', 'table_number', 'created_at',
        ),
    )

    return {
        'period': period,
        'revenue': float(revenue),
        'order_count': order_count,
        'completed_count': completed_count,
        'orders_today': orders.filter(created_at__date=today).count(),
        'sales_by_day': [
            {'date': str(r['day']), 'revenue': float(r['revenue'] or 0), 'count': r['count']}
            for r in sales_by_day
        ],
        'best_sellers': [
            {
                'name': r['menu_item__name'] or '—',
                'quantity': r['qty'],
                'revenue': float(r['revenue'] or 0),
            }
            for r in best_sellers
        ],
        'peak_hours': [
            {'hour': f"{h['hour']:02d}:00", 'count': h['count']}
            for h in peak_hours
        ],
        'avg_prep_minutes': avg_prep_minutes,
        'avg_rating': round(float(avg_rating), 2) if avg_rating else None,
        'review_count': exp_reviews.count(),
        'recent_reviews': recent_reviews,
    }


def build_platform_analytics():
    now = timezone.now()
    month_start = now - timedelta(days=30)

    restaurants = Restaurant.objects.all()
    active = restaurants.filter(is_active=True, subscription_status__in=['trial', 'active'])
    trial = restaurants.filter(subscription_status='trial')
    suspended = restaurants.filter(subscription_status='suspended')

    completed = Order.objects.filter(status='completed', created_at__gte=month_start)
    mrr_estimate = active.filter(subscription_plan='pro').count() * 49000

    return {
        'total_restaurants': restaurants.count(),
        'active_restaurants': active.count(),
        'trial_restaurants': trial.count(),
        'suspended_restaurants': suspended.count(),
        'mrr_estimate_iqd': mrr_estimate,
        'monthly_revenue_platform': float(completed.aggregate(t=Sum('total_amount'))['t'] or 0),
        'monthly_orders': Order.objects.filter(created_at__gte=month_start).count(),
        'restaurants_map': [
            {
                'id': r.id,
                'name': r.name,
                'slug': r.slug,
                'subscription_status': r.subscription_status,
                'subscription_plan': r.subscription_plan,
                'subscription_expires_at': r.subscription_expires_at.isoformat() if r.subscription_expires_at else None,
                'is_active': r.is_active,
                'custom_domain': r.custom_domain,
                'latitude': float(r.latitude) if r.latitude else None,
                'longitude': float(r.longitude) if r.longitude else None,
                'owner': r.owner.username,
            }
            for r in restaurants.select_related('owner').order_by('-created_at')
        ],
    }
