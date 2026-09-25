from django.db.models import Sum, Count
from django.db.models.functions import ExtractHour, ExtractMonth
from django.utils import timezone
from datetime import timedelta

from .models import Order, OrderItem, MenuItem, Restaurant, TableCall

AR_MONTHS = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
             'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

THEME_PREVIEWS = [
    {'id': 'modern-indigo', 'name': 'عصري', 'colors': ['#6366f1', '#f8f9fc', '#f59e0b']},
    {'id': 'classic-gold', 'name': 'ذهبي', 'colors': ['#d4af37', '#0c0c0c', '#f0dfa0']},
    {'id': 'emerald-fresh', 'name': 'أخضر', 'colors': ['#059669', '#f0fdf4', '#34d399']},
    {'id': 'rose-boutique', 'name': 'وردي', 'colors': ['#e11d48', '#fff1f2', '#fda4af']},
    {'id': 'ocean-blue', 'name': 'بحري', 'colors': ['#0284c7', '#f0f9ff', '#38bdf8']},
    {'id': 'sunset-warm', 'name': 'غروب', 'colors': ['#ea580c', '#fff7ed', '#fb923c']},
    {'id': 'midnight-lounge', 'name': 'ليلي', 'colors': ['#8b5cf6', '#0f0a1a', '#a78bfa']},
    {'id': 'minimal-mono', 'name': 'Minimal', 'colors': ['#171717', '#fafafa', '#737373']},
    {'id': 'arabesque', 'name': 'تراثي', 'colors': ['#b45309', '#fefce8', '#d97706']},
    {'id': 'coffee-roast', 'name': 'قهوة', 'colors': ['#78350f', '#fdf8f3', '#a16207']},
]


def _tenant_filter(user):
    """Return Q filter kwargs for tenant-scoped dashboard, or None for platform-wide."""
    if user.is_superuser:
        return None
    return {'tenant__owner': user}


def dashboard_callback(request, context):
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    is_super = request.user.is_superuser
    scope = _tenant_filter(request.user)

    order_qs = Order.objects.all()
    completed_qs = order_qs.filter(status='completed')
    if scope:
        order_qs = order_qs.filter(**scope)
        completed_qs = completed_qs.filter(**scope)

    total_revenue = completed_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    total_orders = completed_qs.count()
    pending_orders = order_qs.filter(status='pending').count()

    if is_super:
        active_restaurants = Restaurant.objects.filter(is_active=True).count()
        total_items = MenuItem.objects.filter(is_available=True).count()
    else:
        owned = Restaurant.objects.filter(owner=request.user, is_active=True)
        active_restaurants = owned.count()
        total_items = MenuItem.objects.filter(tenant__owner=request.user, is_available=True).count()

    call_qs = TableCall.objects.filter(is_resolved=False)
    if scope:
        call_qs = call_qs.filter(**scope)
    unresolved_calls = call_qs.count()

    orders_today = order_qs.filter(created_at__date=today).count()
    orders_week = order_qs.filter(created_at__date__gte=week_ago).count()

    monthly_revenue = (
        completed_qs.annotate(month=ExtractMonth('created_at'))
        .values('month')
        .annotate(total=Sum('total_amount'))
        .order_by('month')
    )
    revenue_labels = [AR_MONTHS[m['month']] if m['month'] < len(AR_MONTHS) else str(m['month']) for m in monthly_revenue]
    revenue_data = [float(m['total']) for m in monthly_revenue]

    item_qs = OrderItem.objects.all()
    if scope:
        item_qs = item_qs.filter(**scope)
    best_sellers = (
        item_qs.values('menu_item__name')
        .annotate(total_qty=Sum('quantity'))
        .order_by('-total_qty')[:6]
    )
    best_seller_labels = [i['menu_item__name'] or '—' for i in best_sellers]
    best_seller_data = [i['total_qty'] for i in best_sellers]

    peak_hours = (
        order_qs.annotate(hour=ExtractHour('created_at'))
        .values('hour')
        .annotate(count=Count('id'))
        .order_by('hour')
    )
    peak_labels = [f"{h['hour']:02d}:00" for h in peak_hours]
    peak_data = [h['count'] for h in peak_hours]

    latest_orders = order_qs.select_related('tenant').order_by('-created_at')[:8]
    user_name = request.user.get_full_name() or request.user.username

    dashboard_mode = 'platform' if is_super else 'tenant'
    owned_restaurants = list(Restaurant.objects.filter(owner=request.user).values('name', 'slug')) if not is_super else []

    cards = [
        {
            'title': 'إجمالي الإيرادات',
            'metric': f'{total_revenue:,.0f}',
            'suffix': 'د.ع',
            'icon': 'payments',
            'accent': '#6366f1',
            'trend': f'+{orders_week} طلب هذا الأسبوع',
            'trend_type': 'up',
        },
        {
            'title': 'الطلبات المكتملة',
            'metric': f'{total_orders:,}',
            'icon': 'shopping_bag',
            'accent': '#10b981',
            'trend': f'{orders_today} اليوم',
            'trend_type': 'up',
        },
        {
            'title': 'طلبات قيد الانتظار',
            'metric': f'{pending_orders:,}',
            'icon': 'pending_actions',
            'accent': '#f59e0b',
            'trend': 'تحتاج متابعة' if pending_orders else 'لا توجد',
            'trend_type': 'neutral',
        },
        {
            'title': 'المطاعm النشطة' if is_super else 'مطاعmي',
            'metric': f'{active_restaurants:,}',
            'icon': 'storefront',
            'accent': '#a855f7',
            'trend': f'{total_items} صنف متاح',
            'trend_type': 'neutral',
        },
        {
            'title': 'طلبات النادل',
            'metric': f'{unresolved_calls:,}',
            'icon': 'notifications_active',
            'accent': '#ef4444',
            'trend': 'غير محلولة' if unresolved_calls else 'الكل محلول',
            'trend_type': 'neutral',
        },
    ]

    if is_super:
        trial_count = Restaurant.objects.filter(subscription_status='trial').count()
        suspended_count = Restaurant.objects.filter(subscription_status='suspended').count()
        cards.append({
            'title': 'اشتراكات تجريبية',
            'metric': f'{trial_count:,}',
            'icon': 'hourglass_top',
            'accent': '#0ea5e9',
            'trend': f'{suspended_count} موقوف',
            'trend_type': 'neutral',
        })

    charts = [
        {
            'id': 'revenueChart',
            'title': 'تحليل الإيرادات الشهرية',
            'icon': 'trending_up',
            'type': 'line',
            'labels': revenue_labels or ['لا بيانات'],
            'label': 'الإيرادات (د.ع)',
            'data': revenue_data or [0],
        },
        {
            'id': 'bestSellersChart',
            'title': 'الأصناف الأكثر مبيعاً',
            'icon': 'star',
            'type': 'bar',
            'labels': best_seller_labels or ['—'],
            'label': 'الكمية',
            'data': best_seller_data or [0],
        },
        {
            'id': 'peakHoursChart',
            'title': 'أوقات الذروة',
            'icon': 'schedule',
            'type': 'bar',
            'labels': peak_labels or ['—'],
            'label': 'عدد الطلبات',
            'data': peak_data or [0],
        },
    ]

    context.update({
        'latest_orders': latest_orders,
        'user_name': user_name,
        'theme_previews': THEME_PREVIEWS,
        'charts': charts,
        'cards': cards,
        'dashboard_mode': dashboard_mode,
        'owned_restaurants': owned_restaurants,
        'is_superuser': is_super,
    })
    return context


def environment_callback(request):
    if request.user.is_superuser:
        return ["E-Menu SaaS — Super Admin", "success"]
    return ["E-Menu Pro — Tenant Admin", "info"]
