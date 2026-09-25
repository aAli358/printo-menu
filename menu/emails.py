import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)


def _tenant_dashboard_url(restaurant) -> str:
    protocol = 'http' if settings.DEBUG else 'https'
    return f'{protocol}://{restaurant.subdomain_host}/dashboard'


def _tenant_menu_url(restaurant) -> str:
    return restaurant.full_menu_url


def send_welcome_email(user, restaurant) -> bool:
    """Send HTML welcome email after registration. Returns True if sent."""
    recipient = user.email
    if not recipient:
        logger.info('Welcome email skipped — no address for user %s', user.username)
        return False

    trial_end = restaurant.subscription_expires_at
    if trial_end:
        trial_end_local = timezone.localtime(trial_end)
        trial_end_display = trial_end_local.strftime('%Y-%m-%d')
        trial_end_display_ar = trial_end_local.strftime('%d/%m/%Y')
    else:
        trial_end_display = trial_end_display_ar = '—'

    context = {
        'owner_name': user.get_full_name() or user.username,
        'restaurant_name': restaurant.name,
        'dashboard_url': _tenant_dashboard_url(restaurant),
        'menu_url': _tenant_menu_url(restaurant),
        'trial_end': trial_end_display,
        'trial_end_ar': trial_end_display_ar,
        'trial_days': 14,
        'slug': restaurant.slug,
    }

    subject = f'مرحباً بك في E-Menu Pro — {restaurant.name}'
    html_body = render_to_string('emails/welcome.html', context)
    text_body = render_to_string('emails/welcome.txt', context)

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=False)
        return True
    except Exception:
        logger.exception('Failed to send welcome email to %s', recipient)
        return False


def send_enterprise_contact_notification(contact) -> bool:
    """Notify platform admin about enterprise contact request."""
    admin_email = getattr(settings, 'ADMIN_CONTACT_EMAIL', None) or settings.DEFAULT_FROM_EMAIL
    context = {
        'contact': contact,
        'created_at': timezone.localtime(contact.created_at).strftime('%Y-%m-%d %H:%M'),
    }
    subject = f'[E-Menu] طلب خطة مؤسسات — {contact.company or contact.name}'
    html_body = render_to_string('emails/enterprise_contact_admin.html', context)
    text_body = (
        f"Enterprise contact\n"
        f"Name: {contact.name}\n"
        f"Email: {contact.email}\n"
        f"Phone: {contact.phone}\n"
        f"Company: {contact.company}\n"
        f"Message:\n{contact.message}\n"
    )
    try:
        msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, [admin_email])
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=False)
        return True
    except Exception:
        logger.exception('Failed to send enterprise contact notification')
        return False
