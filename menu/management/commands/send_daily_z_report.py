"""Send daily Z-style sales summary email to each restaurant owner."""
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.utils import timezone

from menu.analytics_service import build_tenant_analytics
from menu.models import Restaurant


class Command(BaseCommand):
    help = 'Email daily sales summary (Z-Report style) to restaurant owners'

    def handle(self, *args, **options):
        today = timezone.now().date()
        sent = 0
        for restaurant in Restaurant.objects.filter(is_active=True).select_related('owner'):
            owner = restaurant.owner
            if not owner.email:
                continue
            data = build_tenant_analytics(owner, 'day')
            subject = f'[{restaurant.name}] تقرير يوم {today.isoformat()}'
            body = (
                f'إيرادات اليوم: {data["revenue"]}\n'
                f'عدد الطلبات: {data["order_count"]}\n'
                f'طلبات مكتملة: {data["completed_count"]}\n'
                f'— Printo E-Menu'
            )
            send_mail(subject, body, None, [owner.email], fail_silently=True)
            sent += 1
        self.stdout.write(self.style.SUCCESS(f'Sent {sent} daily reports'))
