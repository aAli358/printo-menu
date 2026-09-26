from rest_framework.views import APIView
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import Avg, F, Prefetch
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.http import HttpResponse

from .models import (
    Restaurant, Category, MenuItem, TableCall, MenuItemReview, Order, OrderItem, RestaurantTable, AddonGroup,
    ExperienceReview,
)
from .serializers import (
    RestaurantSerializer, RestaurantListSerializer, PublicMenuSerializer,
    CategorySerializer, CategoryWriteSerializer,
    MenuItemSerializer, MenuItemWriteSerializer, RestaurantBrandingSerializer,
    TableCallSerializer, MenuItemReviewSerializer, OrderSerializer,
    RestaurantTableSerializer, ExperienceReviewSerializer,
)
from .managers import tenant_scoped_queryset
from .tenancy import get_current_tenant
from .querysets import (
    restaurant_with_menu_prefetch, menu_items_for_public_qs,
    orders_for_kitchen_qs, active_restaurants_qs,
)
from .pdf_utils import generate_table_qrs_pdf
from .qr_utils import generate_table_qr_png, generate_table_qr_svg, generate_restaurant_qr_png
from .barcode_utils import generate_table_barcode_png, generate_restaurant_barcode_png
from .kitchen_broadcast import broadcast_kitchen_event
from .permissions import (
    IsTenantOwnerOrReadOnly, IsRestaurantOwner, IsTenantOwner,
    get_user_primary_tenant, validate_tenant_write_access, validate_public_tenant_match,
    object_belongs_to_user,
)


class TenantWriteMixin:
    """Enforce tenant ownership on all write operations."""

    def _resolve_tenant_for_write(self):
        user = self.request.user
        if user.is_superuser:
            tenant_id = self.request.data.get('tenant')
            if tenant_id:
                return get_object_or_404(Restaurant, pk=tenant_id)
            current = get_current_tenant()
            if current:
                return current
            raise ValidationError({'tenant': 'Superuser must specify tenant for this action.'})

        owned = Restaurant.objects.filter(owner=user)
        count = owned.count()
        if count == 0:
            raise PermissionDenied('No restaurant linked to this account.')
        if count == 1:
            return owned.first()

        tenant_id = self.request.data.get('tenant')
        if not tenant_id:
            raise ValidationError({'tenant': 'Multiple restaurants — specify tenant id.'})
        tenant = get_object_or_404(Restaurant, pk=tenant_id, owner=user)
        return tenant

    def perform_create(self, serializer):
        tenant = self._resolve_tenant_for_write()
        validate_tenant_write_access(self.request.user, tenant)
        serializer.save(tenant=tenant)

    def perform_update(self, serializer):
        obj = self.get_object()
        if not object_belongs_to_user(self.request.user, obj):
            raise PermissionDenied('Cannot modify resources of another tenant.')
        serializer.save()

    def perform_destroy(self, instance):
        if not object_belongs_to_user(self.request.user, instance):
            raise PermissionDenied('Cannot delete resources of another tenant.')
        instance.delete()


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Order.objects.none()
        qs = tenant_scoped_queryset(Order, self.request.user)
        if self.action in ('list', 'retrieve', 'live', 'kitchen_board'):
            qs = orders_for_kitchen_qs(qs)
        return qs

    def get_permissions(self):
        if self.action in ('live', 'kitchen_board', 'update_status'):
            return [IsAuthenticated()]
        if self.action in ('list', 'retrieve', 'destroy', 'update', 'partial_update'):
            return [IsAuthenticated()]
        return [AllowAny()]

    def _kitchen_queryset(self, request):
        qs = self.get_queryset()
        status_filter = request.query_params.get('status')
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter)
        else:
            qs = qs.filter(status__in=['pending', 'preparing', 'ready'])
        return qs.order_by('created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenant = serializer.validated_data['tenant']
        validate_public_tenant_match(tenant, request)
        order = serializer.save()

        items_data = request.data.get('items_list', [])
        if not items_data:
            return Response(
                {'detail': 'يجب إضافة صنف واحد على الأقل للطلب.', 'items_list': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        total = 0
        message_items = []

        item_ids = [item.get('id') for item in items_data if item.get('id')]
        menu_items_map = {
            m.id: m for m in MenuItem.objects.filter(id__in=item_ids, tenant=order.tenant)
        }

        for item in items_data:
            menu_item = menu_items_map.get(item.get('id'))
            if not menu_item:
                return Response(
                    {'error': 'Menu item does not belong to this restaurant.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            qty = int(item.get('quantity', 1))
            base = float(menu_item.base_price)
            raw_price = item.get('price')
            try:
                price = float(raw_price) if raw_price is not None else base
            except (TypeError, ValueError):
                price = base
            if price <= 0:
                price = base
            if price > base * 20:
                price = base
            modifiers = item.get('modifiers_text', '')

            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=qty,
                price=price,
                modifiers_text=modifiers,
            )
            total += price * qty

            item_name = menu_item.name
            mod_text = f" ({modifiers})" if modifiers else ""
            message_items.append(f"{qty}x {item_name}{mod_text} - {price * qty:,} {order.tenant.currency_code}")

        coupon_code = (request.data.get('coupon_code') or '').strip()
        order_lines = []
        for item in items_data:
            mid = item.get('id')
            menu_item = menu_items_map.get(mid)
            if not menu_item:
                continue
            base = float(menu_item.base_price)
            raw_price = item.get('price')
            try:
                line_price = float(raw_price) if raw_price is not None else base
            except (TypeError, ValueError):
                line_price = base
            if line_price <= 0 or line_price > base * 20:
                line_price = base
            order_lines.append({
                'menu_item': menu_item,
                'quantity': int(item.get('quantity', 1)),
                'price': line_price,
            })
        from .promotion_service import calculate_order_discount
        discount, applied_coupon = calculate_order_discount(order.tenant, order_lines, coupon_code)

        order.total_amount = max(total - discount, 0)
        order.discount_amount = discount
        order.coupon_code = applied_coupon
        order.save()

        broadcast_kitchen_event(order.tenant_id, 'order.created', {'order_id': order.id})

        whatsapp_link = ""
        if order.tenant.whatsapp_number:
            msg = f"🛍️ *طلب جديد من {order.tenant.name}*\n"
            from .order_constants import DIRECT_ORDER_TABLE_LABEL
            if order.table_number and order.table_number != DIRECT_ORDER_TABLE_LABEL:
                msg += f"📍 *رقم الطاولة:* {order.table_number}\n"
            else:
                msg += f"📍 *نوع الطلب:* {DIRECT_ORDER_TABLE_LABEL}\n"
            msg += f"🆔 *رقم الطلب:* #{order.id}\n"
            msg += "--------------------------\n"
            msg += "\n".join(message_items)
            msg += "\n--------------------------\n"
            if order.discount_amount:
                msg += f"💸 *خصم:* {float(order.discount_amount):,.0f} {order.tenant.currency_code}\n"
            msg += f"💰 *الإجمالي:* {float(order.total_amount):,.0f} {order.tenant.currency_code}"

            import urllib.parse
            encoded_msg = urllib.parse.quote(msg)
            whatsapp_link = f"https://wa.me/{order.tenant.whatsapp_number}?text={encoded_msg}"

        return Response({
            'id': order.id,
            'total_amount': order.total_amount,
            'whatsapp_link': whatsapp_link,
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def live(self, request):
        orders = self._kitchen_queryset(request)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='kitchen')
    def kitchen_board(self, request):
        from .permissions import get_user_primary_tenant
        from .staff_roles import resolve_user_tenant_role

        orders = self._kitchen_queryset(request)
        tenant = get_user_primary_tenant(request.user)
        hide_prices = resolve_user_tenant_role(request.user, tenant) == 'kitchen'
        serializer = OrderSerializer(
            orders, many=True, context={'request': request, 'hide_prices': hide_prices},
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        order = self.get_object()
        if not object_belongs_to_user(request.user, order):
            raise PermissionDenied()
        new_status = request.data.get('status')
        if new_status in dict(Order.STATUS_CHOICES):
            now = timezone.now()
            if new_status == 'preparing' and not order.preparing_at:
                order.preparing_at = now
            elif new_status == 'ready' and not order.ready_at:
                order.ready_at = now
            elif new_status == 'completed' and not order.completed_at:
                order.completed_at = now
            order.status = new_status
            order.save()
            broadcast_kitchen_event(order.tenant_id, 'order.updated', {
                'order_id': order.id,
                'status': new_status,
            })
            from .utils import build_customer_order_status_whatsapp
            return Response({
                'status': f'Order status updated to {new_status}',
                'whatsapp_customer_link': build_customer_order_status_whatsapp(order, new_status),
            })
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)


class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'slug']

    def get_serializer_class(self):
        if self.action == 'list':
            return RestaurantListSerializer
        if self.action == 'public_menu':
            return PublicMenuSerializer
        return RestaurantSerializer

    def get_permissions(self):
        if self.action == 'public_menu':
            return [AllowAny()]
        if self.action in (
            'download_qrs', 'download_general_qr', 'download_general_barcode',
            'update_branding', 'me_detail', 'clear_menu',
        ):
            return [IsAuthenticated()]
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            if self.request.user.is_superuser:
                return Restaurant.objects.all()
            return Restaurant.objects.filter(owner=self.request.user)
        return Restaurant.objects.filter(is_active=True, subscription_status__in=['trial', 'active'])

    def perform_create(self, serializer):
        if not self.request.user.is_superuser:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        restaurant = self.get_object()
        if not object_belongs_to_user(self.request.user, restaurant):
            raise PermissionDenied()
        serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='my')
    def me_detail(self, request):
        tenant = get_user_primary_tenant(request.user)
        if not tenant:
            return Response({'detail': 'No restaurant found.'}, status=404)
        serializer = RestaurantSerializer(tenant)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], url_path='clear-menu')
    def clear_menu(self, request, slug=None):
        """Delete all categories (and cascaded menu items) for this restaurant."""
        restaurant = self.get_object()
        if not object_belongs_to_user(request.user, restaurant):
            raise PermissionDenied()
        confirm = (request.data.get('confirm') or '').strip()
        if confirm != restaurant.slug:
            raise ValidationError({
                'confirm': f'اكتب slug المطعم للتأكيد: {restaurant.slug}',
            })
        categories_qs = Category.objects.filter(tenant=restaurant)
        items_count = MenuItem.objects.filter(tenant=restaurant).count()
        categories_count = categories_qs.count()
        with transaction.atomic():
            categories_qs.delete()
        return Response({
            'status': 'ok',
            'deleted_categories': categories_count,
            'deleted_items': items_count,
        })

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated], url_path='branding')
    def update_branding(self, request, slug=None):
        restaurant = self.get_object()
        if not object_belongs_to_user(request.user, restaurant):
            raise PermissionDenied()
        serializer = RestaurantBrandingSerializer(
            restaurant,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        restaurant.refresh_from_db()
        return Response(RestaurantSerializer(restaurant, context={'request': request}).data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def download_qrs(self, request, slug=None):
        restaurant = self.get_object()
        if not object_belongs_to_user(request.user, restaurant):
            raise PermissionDenied()
        table_count = int(request.GET.get('tables', 20))
        pdf_buffer = generate_table_qrs_pdf(restaurant, table_count)
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{restaurant.slug}-tables-qrs.pdf"'
        return response

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated], url_path='qr-general')
    def download_general_qr(self, request, slug=None):
        restaurant = self.get_object()
        if not object_belongs_to_user(request.user, restaurant):
            raise PermissionDenied()
        png = generate_restaurant_qr_png(restaurant)
        response = HttpResponse(png.getvalue(), content_type='image/png')
        response['Content-Disposition'] = f'attachment; filename="{restaurant.slug}-general-qr.png"'
        return response

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated], url_path='barcode-general')
    def download_general_barcode(self, request, slug=None):
        restaurant = self.get_object()
        if not object_belongs_to_user(request.user, restaurant):
            raise PermissionDenied()
        png = generate_restaurant_barcode_png(restaurant)
        response = HttpResponse(png.getvalue(), content_type='image/png')
        response['Content-Disposition'] = f'attachment; filename="{restaurant.slug}-general-barcode.png"'
        return response

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def public_menu(self, request, slug=None):
        base = active_restaurants_qs().filter(slug=slug)
        restaurant = get_object_or_404(restaurant_with_menu_prefetch(base))
        serializer = PublicMenuSerializer(restaurant, context={'request': request})
        return Response(serializer.data)


class CategoryViewSet(TenantWriteMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    permission_classes = [IsTenantOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tenant', 'is_active']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return CategoryWriteSerializer
        return CategorySerializer

    def get_queryset(self):
        qs = tenant_scoped_queryset(Category, self.request.user)
        if self.action in ('list', 'retrieve'):
            item_qs = menu_items_for_public_qs()
            qs = qs.prefetch_related(Prefetch('items', queryset=item_qs))
        return qs.order_by('order')


class MenuItemViewSet(TenantWriteMixin, viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    permission_classes = [IsTenantOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_available']
    search_fields = ['name', 'description', 'tags']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return MenuItemWriteSerializer
        return MenuItemSerializer

    def get_queryset(self):
        qs = tenant_scoped_queryset(MenuItem, self.request.user)
        if self.action in ('list', 'retrieve'):
            qs = qs.select_related('category').prefetch_related(
                'variants',
                Prefetch('addon_groups', queryset=AddonGroup.objects.prefetch_related('addons')),
            ).annotate(avg_rating=Avg('reviews__rating'))
        return qs.order_by('order')

    def perform_create(self, serializer):
        category = serializer.validated_data['category']
        validate_tenant_write_access(self.request.user, category.tenant)
        serializer.save(tenant=category.tenant)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_stock(self, request, pk=None):
        item = self.get_object()
        if not object_belongs_to_user(request.user, item):
            raise PermissionDenied()
        item.is_available = not item.is_available
        item.save()
        return Response({'status': 'Stock toggled', 'is_available': item.is_available})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='low-stock')
    def low_stock(self, request):
        qs = self.get_queryset().filter(
            stock_quantity__isnull=False,
            stock_quantity__lte=F('low_stock_threshold'),
        )
        serializer = MenuItemSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class RestaurantTableViewSet(TenantWriteMixin, viewsets.ModelViewSet):
    queryset = RestaurantTable.objects.all()
    serializer_class = RestaurantTableSerializer
    permission_classes = [IsTenantOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'status']

    def get_queryset(self):
        return tenant_scoped_queryset(RestaurantTable, self.request.user).select_related('tenant')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['tenant'] = get_user_primary_tenant(self.request.user)
        return ctx

    @action(detail=True, methods=['get'], url_path='qr')
    def qr(self, request, pk=None):
        table = self.get_object()
        if not object_belongs_to_user(request.user, table):
            raise PermissionDenied()
        fmt = request.GET.get('ext', request.GET.get('file_type', 'png')).lower()
        if fmt == 'svg':
            svg = generate_table_qr_svg(table.tenant, table.number)
            response = HttpResponse(svg, content_type='image/svg+xml')
            response['Content-Disposition'] = f'attachment; filename="{table.tenant.slug}-table-{table.number}.svg"'
            return response
        png = generate_table_qr_png(table.tenant, table.number)
        response = HttpResponse(png.getvalue(), content_type='image/png')
        response['Content-Disposition'] = f'attachment; filename="{table.tenant.slug}-table-{table.number}.png"'
        return response

    @action(detail=True, methods=['get'], url_path='barcode')
    def barcode(self, request, pk=None):
        table = self.get_object()
        if not object_belongs_to_user(request.user, table):
            raise PermissionDenied()
        png = generate_table_barcode_png(table.tenant, table.number)
        response = HttpResponse(png.getvalue(), content_type='image/png')
        response['Content-Disposition'] = f'attachment; filename="{table.tenant.slug}-table-{table.number}-barcode.png"'
        return response

    @action(detail=False, methods=['post'], url_path='bulk-generate')
    def bulk_generate(self, request):
        """Create tables 1..N for the owner's restaurant."""
        tenant = get_user_primary_tenant(request.user)
        if not tenant:
            raise PermissionDenied('No restaurant linked to this account.')
        validate_tenant_write_access(request.user, tenant)
        count = int(request.data.get('count', 10))
        count = max(1, min(count, 100))
        created = []
        for n in range(1, count + 1):
            num = str(n)
            table, was_created = RestaurantTable.objects.get_or_create(
                tenant=tenant, number=num,
                defaults={
                    'label': f'Table {num}',
                    'is_active': True,
                    'capacity': 4,
                    'status': RestaurantTable.STATUS_AVAILABLE,
                },
            )
            if was_created:
                created.append(table)
        serializer = self.get_serializer(RestaurantTable.objects.filter(tenant=tenant), many=True)
        return Response({'created': len(created), 'tables': serializer.data})


class TableCallViewSet(viewsets.ModelViewSet):
    queryset = TableCall.objects.all()
    serializer_class = TableCallSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_permissions(self):
        if self.action in ('resolve', 'pending'):
            return [IsAuthenticated()]
        if self.action in ('list', 'retrieve', 'destroy', 'update', 'partial_update'):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return tenant_scoped_queryset(TableCall, self.request.user)
        return TableCall.objects.none()

    def perform_create(self, serializer):
        tenant = serializer.validated_data.get('tenant')
        if not tenant:
            raise ValidationError({'restaurant': 'Tenant is required.'})
        validate_public_tenant_match(tenant, self.request)
        call = serializer.save()
        broadcast_kitchen_event(tenant.id, 'table_call.created', {'call_id': call.id})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def pending(self, request):
        calls = self.get_queryset().filter(is_resolved=False).order_by('-created_at')
        serializer = TableCallSerializer(calls, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def resolve(self, request, pk=None):
        call = self.get_object()
        if not object_belongs_to_user(request.user, call):
            raise PermissionDenied()
        call.is_resolved = True
        call.save()
        broadcast_kitchen_event(call.tenant_id, 'table_call.resolved', {'call_id': call.id})
        return Response({'status': 'Call resolved'})


class MenuItemReviewViewSet(viewsets.ModelViewSet):
    queryset = MenuItemReview.objects.all()
    serializer_class = MenuItemReviewSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        tenant = get_current_tenant()
        if tenant:
            return MenuItemReview.objects.filter(item__tenant=tenant).select_related('item')
        return MenuItemReview.objects.none()

    def perform_create(self, serializer):
        item_id = self.request.data.get('item')
        item = get_object_or_404(MenuItem, id=item_id)
        tenant = get_current_tenant()
        if tenant and item.tenant_id != tenant.id:
            raise PermissionDenied('Item does not belong to current tenant.')
        if not tenant:
            raise ValidationError({'item': 'Open menu with ?r=slug to submit a review.'})
        serializer.save(item=item)


class ExperienceReviewViewSet(viewsets.ModelViewSet):
    queryset = ExperienceReview.objects.all()
    serializer_class = ExperienceReviewSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return tenant_scoped_queryset(ExperienceReview, self.request.user)
        tenant = get_current_tenant()
        if tenant:
            return ExperienceReview.objects.filter(tenant=tenant)
        return ExperienceReview.objects.none()

    def perform_create(self, serializer):
        tenant = get_current_tenant()
        if not tenant:
            raise ValidationError({'detail': 'Open menu with ?r=slug to submit a review.'})
        table_number = self.request.data.get('table_number', '')
        serializer.save(tenant=tenant, table_number=table_number or '')


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'ok'})
