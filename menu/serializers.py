from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import (
    Restaurant, Category, MenuItem, MenuItemVariant, AddonGroup, Addon,
    OpeningHours, MenuItemReview, ExperienceReview, TableCall, Order, OrderItem, RestaurantTable,
    RestaurantStaff,
)

User = get_user_model()
from .utils import format_order_for_whatsapp
from .permissions import get_user_tenants
from .platform_branding import build_platform_branding
from .querysets import active_restaurants_qs
from .tenancy import get_current_tenant
import urllib.parse


def _tenant_scoped_restaurant_qs():
    qs = active_restaurants_qs()
    tenant = get_current_tenant()
    if tenant:
        qs = qs.filter(pk=tenant.pk)
    return qs


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'quantity', 'price', 'modifiers_text']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.context.get('hide_prices'):
            data.pop('price', None)
        return data


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    whatsapp_link = serializers.SerializerMethodField()
    restaurant = serializers.PrimaryKeyRelatedField(
        source='tenant',
        queryset=Restaurant.objects.none(),
    )

    class Meta:
        model = Order
        fields = [
            'id', 'restaurant', 'table_number', 'customer_name', 'customer_phone',
            'access_source', 'total_amount', 'discount_amount', 'coupon_code',
            'status', 'created_at', 'items', 'whatsapp_link',
        ]
        read_only_fields = ['total_amount', 'status', 'created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['restaurant'].queryset = _tenant_scoped_restaurant_qs()

    def get_whatsapp_link(self, obj):
        if not obj.tenant.whatsapp_number:
            return None
        message = format_order_for_whatsapp(obj)
        encoded_message = urllib.parse.quote(message)
        return f"https://wa.me/{obj.tenant.whatsapp_number}?text={encoded_message}"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.context.get('hide_prices'):
            data.pop('total_amount', None)
            data.pop('discount_amount', None)
        return data


class OpeningHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpeningHours
        fields = ['day', 'open_time', 'close_time', 'is_closed']


class AddonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Addon
        fields = ['id', 'name', 'name_en', 'price']


class AddonGroupSerializer(serializers.ModelSerializer):
    addons = AddonSerializer(many=True, read_only=True)

    class Meta:
        model = AddonGroup
        fields = ['id', 'name', 'name_en', 'min_selection', 'max_selection', 'addons']


class MenuItemVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemVariant
        fields = ['id', 'name', 'name_en', 'price']


class MenuItemReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemReview
        fields = ['id', 'item', 'rating', 'comment', 'created_at']


class ExperienceReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceReview
        fields = ['id', 'rating', 'comment', 'table_number', 'created_at']
        read_only_fields = ['id', 'created_at']


class MenuItemSerializer(serializers.ModelSerializer):
    variants = MenuItemVariantSerializer(many=True, read_only=True)
    addon_groups = AddonGroupSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'name_en', 'description', 'description_en',
            'image', 'base_price', 'is_available', 'stock_quantity', 'low_stock_threshold',
            'tags', 'variants', 'addon_groups', 'average_rating',
        ]

    def get_average_rating(self, obj):
        avg = getattr(obj, 'avg_rating', None)
        if avg is not None:
            return round(float(avg), 1)
        return obj.average_rating


class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'name_en', 'icon', 'order', 'items']


class RestaurantListSerializer(serializers.ModelSerializer):
    """Minimal fields for public restaurant directory (no nested menu)."""

    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'name_en', 'slug', 'logo', 'description', 'description_en', 'menu_theme']


class RestaurantSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    opening_hours = OpeningHoursSerializer(many=True, read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'name_en', 'slug', 'logo', 'cover_image', 'description',
            'description_en', 'phone', 'whatsapp_number', 'address', 'currency_code',
            'primary_color', 'secondary_color', 'access_mode',
            'font_family', 'theme_mode', 'menu_theme', 'qr_code', 'qr_color',
            'subscription_status', 'subscription_plan', 'subscription_expires_at',
            'custom_domain', 'landing_theme', 'hide_platform_branding', 'latitude', 'longitude',
            'categories', 'opening_hours',
        ]


class PublicMenuSerializer(RestaurantSerializer):
    platform_branding = serializers.SerializerMethodField()

    class Meta(RestaurantSerializer.Meta):
        fields = RestaurantSerializer.Meta.fields + ['platform_branding']

    def get_platform_branding(self, obj):
        request = self.context.get('request')
        return build_platform_branding(obj, request)


class TableCallSerializer(serializers.ModelSerializer):
    restaurant = serializers.PrimaryKeyRelatedField(
        source='tenant',
        queryset=Restaurant.objects.none(),
    )

    class Meta:
        model = TableCall
        fields = ['id', 'restaurant', 'table_number', 'call_type', 'access_source', 'is_resolved', 'created_at']
        read_only_fields = ['is_resolved']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['restaurant'].queryset = _tenant_scoped_restaurant_qs()


class CategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'name_en', 'icon', 'order', 'is_active']
        read_only_fields = ['id']


class MenuItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'name', 'name_en', 'description', 'description_en',
            'image', 'base_price', 'is_available', 'stock_quantity', 'low_stock_threshold',
            'tags', 'order',
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'is_available': {'required': False},
            'stock_quantity': {'required': False, 'allow_null': True},
        }

    def create(self, validated_data):
        validated_data.setdefault('is_available', True)
        return super().create(validated_data)

    def validate_category(self, category):
        request = self.context.get('request')
        if request and request.user.is_authenticated and not request.user.is_superuser:
            if category.tenant.owner_id != request.user.id:
                raise serializers.ValidationError('Category does not belong to your restaurant.')
        instance = self.instance
        if instance and category.tenant_id != instance.tenant_id:
            raise serializers.ValidationError('Category must belong to the same restaurant as the item.')
        return category


class RestaurantBrandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = [
            'name', 'name_en', 'description', 'description_en', 'phone', 'whatsapp_number', 'address',
            'currency_code', 'primary_color', 'secondary_color', 'font_family', 'theme_mode',
            'menu_theme', 'logo', 'cover_image', 'qr_color', 'access_mode', 'landing_theme',
        ]


class RestaurantTableSerializer(serializers.ModelSerializer):
    menu_url = serializers.SerializerMethodField()
    qr_png_url = serializers.SerializerMethodField()

    class Meta:
        model = RestaurantTable
        fields = ['id', 'number', 'label', 'is_active', 'menu_url', 'qr_png_url']
        read_only_fields = ['id', 'menu_url', 'qr_png_url']

    def get_menu_url(self, obj):
        request = self.context.get('request')
        url = obj.tenant.get_qr_url(table_id=obj.number)
        return url

    def get_qr_png_url(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        return request.build_absolute_uri(
            f'/api/v1/tables/{obj.id}/qr/?ext=png'
        )


class RestaurantStaffSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = RestaurantStaff
        fields = ['id', 'user_id', 'username', 'role', 'tenant']
        read_only_fields = ['id', 'user_id', 'username']


class RestaurantStaffCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    role = serializers.ChoiceField(choices=RestaurantStaff.ROLE_CHOICES)

    def validate_username(self, value):
        if not User.objects.filter(username=value).exists():
            raise serializers.ValidationError('User not found.')
        return value
