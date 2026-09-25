"""Tenant isolation, auth handoff, and promotion tests."""
from datetime import timedelta, time
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from menu.models import Restaurant, Category, MenuItem, ExperienceReview, AuthHandoff, Promotion
from menu.promotion_service import calculate_order_discount, is_promo_active

User = get_user_model()


class TenantIsolationTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username='owner_a', password='testpass123')
        self.user_b = User.objects.create_user(username='owner_b', password='testpass123')
        self.rest_a = Restaurant.objects.create(owner=self.user_a, name='Restaurant A')
        self.rest_b = Restaurant.objects.create(owner=self.user_b, name='Restaurant B')
        self.cat_a = Category.objects.create(tenant=self.rest_a, name='Cat A')
        self.cat_b = Category.objects.create(tenant=self.rest_b, name='Cat B')
        self.client = APIClient()

    def test_owner_sees_only_own_categories(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get('/api/v1/categories/')
        self.assertEqual(response.status_code, 200)
        ids = {c['id'] for c in response.data}
        self.assertIn(self.cat_a.id, ids)
        self.assertNotIn(self.cat_b.id, ids)

    def test_clear_menu_requires_confirm_slug(self):
        MenuItem.objects.create(
            category=self.cat_a, tenant=self.rest_a, name='Item', base_price=Decimal('10.00'),
        )
        self.client.force_authenticate(user=self.user_a)
        bad = self.client.post(f'/api/v1/restaurants/{self.rest_a.slug}/clear-menu/', {'confirm': 'wrong'})
        self.assertEqual(bad.status_code, 400)
        self.assertEqual(Category.objects.filter(tenant=self.rest_a).count(), 1)

        ok = self.client.post(f'/api/v1/restaurants/{self.rest_a.slug}/clear-menu/', {'confirm': self.rest_a.slug})
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(Category.objects.filter(tenant=self.rest_a).count(), 0)
        self.assertEqual(MenuItem.objects.filter(tenant=self.rest_a).count(), 0)
        self.assertEqual(Category.objects.filter(tenant=self.rest_b).count(), 1)

    def test_experience_review_requires_tenant_context(self):
        response = self.client.post('/api/v1/experience-reviews/', {'rating': 5, 'comment': 'Great'})
        self.assertEqual(response.status_code, 400)

    def test_experience_review_with_tenant_header(self):
        response = self.client.post(
            '/api/v1/experience-reviews/',
            {'rating': 4, 'comment': 'Nice', 'table_number': '3'},
            HTTP_X_TENANT_SLUG=self.rest_a.slug,
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ExperienceReview.objects.filter(tenant=self.rest_a).count(), 1)


class AuthHandoffTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='handoff_user', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_handoff_create_and_consume(self):
        create_resp = self.client.post('/api/v1/auth/handoff/', {
            'access': 'access-token-abc',
            'refresh': 'refresh-token-xyz',
            'user': {'id': self.user.id, 'username': self.user.username, 'email': ''},
            'restaurants': [],
        }, format='json')
        self.assertEqual(create_resp.status_code, 200)
        code = create_resp.data['code']

        self.client.logout()
        consume_resp = self.client.post('/api/v1/auth/handoff/consume/', {'code': code})
        self.assertEqual(consume_resp.status_code, 200)
        self.assertEqual(consume_resp.data['access'], 'access-token-abc')
        self.assertFalse(AuthHandoff.objects.filter(code=code).exists())

    def test_expired_handoff_rejected(self):
        code = 'expired-code-test'
        AuthHandoff.objects.create(
            code=code,
            access_token='a',
            refresh_token='r',
            user_data={'id': 1},
            restaurants_data=[],
            expires_at=timezone.now() - timedelta(seconds=1),
        )
        response = self.client.post('/api/v1/auth/handoff/consume/', {'code': code})
        self.assertEqual(response.status_code, 404)


class HealthEndpointTests(TestCase):
    def test_health_ok(self):
        response = APIClient().get('/api/v1/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ok')


class BarcodeEndpointTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='barcode_owner', password='testpass123')
        self.restaurant = Restaurant.objects.create(owner=self.user, name='Barcode Cafe')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_general_barcode_download(self):
        response = self.client.get(f'/api/v1/restaurants/{self.restaurant.slug}/barcode-general/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'image/png')
        self.assertTrue(len(response.content) > 100)


class PromotionDiscountTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='promo_owner', password='testpass123')
        self.restaurant = Restaurant.objects.create(owner=self.user, name='Promo Place')
        self.category = Category.objects.create(tenant=self.restaurant, name='Drinks')
        self.item = MenuItem.objects.create(
            tenant=self.restaurant, category=self.category, name='Juice', base_price=Decimal('10.00'),
        )
        self.client = APIClient()

    def test_happy_hour_discount(self):
        Promotion.objects.create(
            tenant=self.restaurant, name='Happy', promo_type='happy_hour',
            discount_percent=Decimal('10'), is_active=True,
            start_time=time(0, 0), end_time=time(23, 59),
        )
        lines = [{'menu_item': self.item, 'quantity': 2, 'price': 10.0}]
        discount, _ = calculate_order_discount(self.restaurant, lines)
        self.assertEqual(discount, 2.0)

    def test_category_discount(self):
        Promotion.objects.create(
            tenant=self.restaurant, name='Drinks off', promo_type='category_discount',
            discount_percent=Decimal('20'), category=self.category, is_active=True,
        )
        lines = [{'menu_item': self.item, 'quantity': 1, 'price': 10.0}]
        discount, _ = calculate_order_discount(self.restaurant, lines)
        self.assertEqual(discount, 2.0)

    def test_order_uses_client_line_price(self):
        response = self.client.post(
            '/api/v1/orders/',
            {
                'restaurant': self.restaurant.id,
                'table_number': '3',
                'items_list': [{'id': self.item.id, 'quantity': 1, 'price': 25.0}],
            },
            format='json',
            HTTP_X_TENANT_SLUG=self.restaurant.slug,
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['total_amount'], 25.0)

    def test_coupon_on_order_create(self):
        Promotion.objects.create(
            tenant=self.restaurant, name='SAVE10', promo_type='coupon',
            coupon_code='SAVE10', discount_percent=Decimal('10'), is_active=True,
        )
        response = self.client.post(
            '/api/v1/orders/',
            {
                'restaurant': self.restaurant.id,
                'table_number': '5',
                'coupon_code': 'SAVE10',
                'items_list': [{'id': self.item.id, 'quantity': 2}],
            },
            format='json',
            HTTP_X_TENANT_SLUG=self.restaurant.slug,
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['total_amount'], 18.0)

    def test_public_reservation_create(self):
        reserved = timezone.now() + timedelta(days=1)
        response = self.client.post(
            '/api/v1/reservations/',
            {
                'customer_name': 'Ali',
                'customer_phone': '0500000000',
                'party_size': 4,
                'reserved_at': reserved.isoformat(),
            },
            format='json',
            HTTP_X_TENANT_SLUG=self.restaurant.slug,
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['customer_name'], 'Ali')


class RegisterSuperuserTests(TestCase):
    def test_register_includes_is_superuser(self):
        client = APIClient()
        response = client.post('/api/v1/auth/register/', {
            'username': 'newowner',
            'password': 'testpass123',
            'restaurant_name': 'New Cafe',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertIn('is_superuser', response.data['user'])
        self.assertFalse(response.data['user']['is_superuser'])
