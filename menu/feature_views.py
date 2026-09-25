from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import (
    Promotion, TableReservation, WaitlistEntry,
    MenuItemVariant, AddonGroup, Addon, Category, MenuItem, Restaurant,
)
from .feature_serializers import (
    PromotionSerializer, TableReservationSerializer, WaitlistEntrySerializer,
    MenuItemVariantWriteSerializer, AddonGroupWriteSerializer,
    ReorderSerializer, PlatformRestaurantSerializer, PlatformSubscriptionPatchSerializer,
)
from .analytics_service import build_tenant_analytics, build_platform_analytics
from .managers import tenant_scoped_queryset
from .permissions import (
    get_user_primary_tenant, validate_tenant_write_access, object_belongs_to_user,
    validate_public_tenant_match,
)
from .tenancy import get_current_tenant
from .views import TenantWriteMixin


class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class TenantAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'week')
        if period not in ('day', 'week', 'month'):
            period = 'week'
        return Response(build_tenant_analytics(request.user, period))


class PlatformStatsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]

    def get(self, request):
        return Response(build_platform_analytics())


class PlatformRestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.select_related('owner').all()
    serializer_class = PlatformRestaurantSerializer
    permission_classes = [IsAuthenticated, IsSuperUser]
    lookup_field = 'pk'

    @action(detail=True, methods=['patch'], url_path='subscription')
    def patch_subscription(self, request, pk=None):
        restaurant = self.get_object()
        ser = PlatformSubscriptionPatchSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        if 'subscription_status' in data:
            restaurant.subscription_status = data['subscription_status']
        if 'subscription_plan' in data:
            restaurant.subscription_plan = data['subscription_plan']
        if 'is_active' in data:
            restaurant.is_active = data['is_active']
        if 'extend_days' in data:
            base = restaurant.subscription_expires_at or timezone.now()
            restaurant.subscription_expires_at = base + timedelta(days=data['extend_days'])
        restaurant.save()
        return Response(PlatformRestaurantSerializer(restaurant).data)


class PromotionViewSet(TenantWriteMixin, viewsets.ModelViewSet):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return tenant_scoped_queryset(Promotion, self.request.user).select_related('category')

    def perform_create(self, serializer):
        tenant = get_user_primary_tenant(self.request.user)
        if not tenant:
            raise PermissionDenied('No restaurant linked.')
        validate_tenant_write_access(self.request.user, tenant)
        serializer.save(tenant=tenant)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='active')
    def active_promotions(self, request):
        tenant = get_current_tenant()
        if not tenant:
            return Response([])
        now = timezone.now()
        qs = Promotion.objects.filter(tenant=tenant, is_active=True)
        active = []
        for promo in qs:
            if promo.valid_from and promo.valid_from > now:
                continue
            if promo.valid_until and promo.valid_until < now:
                continue
            if promo.promo_type == 'happy_hour':
                t = now.time()
                if promo.start_time and promo.end_time:
                    if promo.start_time <= promo.end_time:
                        if not (promo.start_time <= t <= promo.end_time):
                            continue
                    elif not (t >= promo.start_time or t <= promo.end_time):
                        continue
                if promo.days_of_week and now.weekday() not in promo.days_of_week:
                    continue
            active.append(promo)
        return Response(PromotionSerializer(active, many=True).data)


class TableReservationViewSet(viewsets.ModelViewSet):
    queryset = TableReservation.objects.all()
    serializer_class = TableReservationSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'partial_update', 'update', 'confirm'):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return tenant_scoped_queryset(TableReservation, self.request.user)
        return TableReservation.objects.none()

    def perform_create(self, serializer):
        tenant = get_current_tenant()
        if not tenant:
            raise ValidationError({'detail': 'Open menu with ?r=slug to book.'})
        validate_public_tenant_match(tenant, self.request)
        serializer.save(tenant=tenant)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def confirm(self, request, pk=None):
        reservation = self.get_object()
        if not object_belongs_to_user(request.user, reservation):
            raise PermissionDenied()
        reservation.status = 'confirmed'
        reservation.save()
        return Response(TableReservationSerializer(reservation).data)


class WaitlistViewSet(viewsets.ModelViewSet):
    queryset = WaitlistEntry.objects.all()
    serializer_class = WaitlistEntrySerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'partial_update', 'update', 'seat'):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return tenant_scoped_queryset(WaitlistEntry, self.request.user).filter(status='waiting')
        return WaitlistEntry.objects.none()

    def perform_create(self, serializer):
        tenant = get_current_tenant()
        if not tenant:
            raise ValidationError({'detail': 'Open menu with ?r=slug to join waitlist.'})
        validate_public_tenant_match(tenant, self.request)
        serializer.save(tenant=tenant)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def seat(self, request, pk=None):
        entry = self.get_object()
        if not object_belongs_to_user(request.user, entry):
            raise PermissionDenied()
        entry.status = 'seated'
        entry.save()
        return Response(WaitlistEntrySerializer(entry).data)


class MenuItemVariantViewSet(TenantWriteMixin, viewsets.ModelViewSet):
    queryset = MenuItemVariant.objects.all()
    serializer_class = MenuItemVariantWriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MenuItemVariant.objects.filter(
            menu_item__tenant__owner=self.request.user,
        ) if not self.request.user.is_superuser else MenuItemVariant.objects.all()

    def perform_create(self, serializer):
        item = serializer.validated_data['menu_item']
        validate_tenant_write_access(self.request.user, item.tenant)
        serializer.save()


class AddonGroupViewSet(TenantWriteMixin, viewsets.ModelViewSet):
    queryset = AddonGroup.objects.all()
    serializer_class = AddonGroupWriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AddonGroup.objects.prefetch_related('addons')
        if not self.request.user.is_superuser:
            qs = qs.filter(menu_item__tenant__owner=self.request.user)
        return qs

    def perform_create(self, serializer):
        item = serializer.validated_data['menu_item']
        validate_tenant_write_access(self.request.user, item.tenant)
        serializer.save()


class CategoryReorderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = ReorderSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        for row in ser.validated_data['items']:
            cat = Category.objects.filter(pk=row['id']).first()
            if not cat or not object_belongs_to_user(request.user, cat):
                continue
            cat.order = int(row.get('order', 0))
            cat.save(update_fields=['order'])
        return Response({'status': 'ok'})


class MenuItemReorderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = ReorderSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        for row in ser.validated_data['items']:
            item = MenuItem.objects.filter(pk=row['id']).first()
            if not item or not object_belongs_to_user(request.user, item):
                continue
            item.order = int(row.get('order', 0))
            item.save(update_fields=['order'])
        return Response({'status': 'ok'})
