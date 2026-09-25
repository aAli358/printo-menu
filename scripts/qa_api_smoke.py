"""API smoke tests for E-Menu — run: python scripts/qa_api_smoke.py"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import Client
from rest_framework_simplejwt.tokens import RefreshToken

from menu.models import Restaurant, Category, MenuItem, Promotion, Order

User = get_user_model()
FAILURES = []
PASSED = 0


def ok(name):
    global PASSED
    PASSED += 1
    print(f'  OK  {name}')


def fail(name, detail=''):
    FAILURES.append((name, detail))
    print(f'  FAIL {name}: {detail}')


def main():
    c = Client()
    print('\n=== E-Menu API Smoke Tests ===\n')

    # Health
    r = c.get('/api/v1/health/')
    if r.status_code == 200 and r.json().get('status') == 'ok':
        ok('health')
    else:
        fail('health', str(r.status_code))

    # Platform branding
    r = c.get('/api/v1/platform/branding/')
    if r.status_code == 200:
        ok('platform branding')
    else:
        fail('platform branding', str(r.status_code))

    # Public menu
    rest = Restaurant.objects.filter(slug='shams').first()
    if not rest:
        rest = Restaurant.objects.first()
    if rest:
        r = c.get(f'/api/v1/restaurants/{rest.slug}/public_menu/', HTTP_X_TENANT_SLUG=rest.slug)
        if r.status_code == 200 and 'categories' in r.json():
            ok(f'public_menu ({rest.slug})')
        else:
            fail('public_menu', str(r.status_code))
    else:
        fail('public_menu', 'no restaurant in DB')

    # Auth + protected endpoints
    owner = User.objects.filter(restaurants__isnull=False).first()
    if owner:
        token = str(RefreshToken.for_user(owner).access_token)
        auth = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        tenant = Restaurant.objects.filter(owner=owner).first()

        r = c.get('/api/v1/auth/me/', **auth)
        if r.status_code == 200:
            ok('auth/me')
        else:
            fail('auth/me', str(r.status_code))

        r = c.get('/api/v1/analytics/?period=week', **auth)
        if r.status_code == 200 and 'revenue' in r.json():
            ok('analytics')
        else:
            fail('analytics', str(r.status_code))

        r = c.get('/api/v1/restaurants/my/', **auth)
        if r.status_code == 200:
            ok('restaurants/my')
        else:
            fail('restaurants/my', str(r.status_code))

        r = c.get('/api/v1/promotions/', **auth)
        if r.status_code == 200:
            ok('promotions list')
        else:
            fail('promotions list', str(r.status_code))

        r = c.get('/api/v1/reservations/', **auth)
        if r.status_code == 200:
            ok('reservations list')
        else:
            fail('reservations list', str(r.status_code))

        if tenant:
            r = c.get(f'/api/v1/restaurants/{tenant.slug}/qr-general/', **auth)
            if r.status_code == 200:
                ok('qr-general download')
            else:
                fail('qr-general', str(r.status_code))

        r = c.get('/api/v1/orders/kitchen/', **auth)
        if r.status_code == 200:
            ok('kitchen orders')
        else:
            fail('kitchen orders', str(r.status_code))
    else:
        fail('auth tests', 'no owner user')

    # Experience review (public with tenant)
    if rest:
        r = c.post(
            '/api/v1/experience-reviews/',
            {'rating': 5, 'comment': 'QA test'},
            content_type='application/json',
            HTTP_X_TENANT_SLUG=rest.slug,
        )
        if r.status_code == 201:
            ok('experience review create')
        else:
            fail('experience review', f'{r.status_code} {r.content[:200]}')

    # Active promotions public
    if rest:
        r = c.get('/api/v1/promotions/active/', HTTP_X_TENANT_SLUG=rest.slug)
        if r.status_code == 200:
            ok('promotions/active')
        else:
            fail('promotions/active', str(r.status_code))

    print(f'\n=== Results: {PASSED} passed, {len(FAILURES)} failed ===')
    if FAILURES:
        for name, detail in FAILURES:
            print(f'  - {name}: {detail}')
        sys.exit(1)
    print('All smoke tests passed.\n')


if __name__ == '__main__':
    main()
