from rest_framework import serializers

from .models import (
    Promotion, TableReservation, WaitlistEntry,
    MenuItemVariant, AddonGroup, Addon, Category, MenuItem, Restaurant,
)


class PromotionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Promotion
        fields = [
            'id', 'name', 'promo_type', 'discount_percent', 'discount_amount',
            'category', 'category_name', 'buy_quantity', 'get_quantity', 'coupon_code',
            'start_time', 'end_time', 'days_of_week', 'valid_from', 'valid_until',
            'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class TableReservationSerializer(serializers.ModelSerializer):
    whatsapp_link = serializers.SerializerMethodField()

    class Meta:
        model = TableReservation
        fields = [
            'id', 'customer_name', 'customer_phone', 'party_size', 'reserved_at',
            'table_number', 'status', 'notes', 'whatsapp_notified', 'whatsapp_link', 'created_at',
        ]
        read_only_fields = ['id', 'whatsapp_notified', 'created_at']

    def get_whatsapp_link(self, obj):
        tenant = obj.tenant
        if not tenant.whatsapp_number:
            return None
        import urllib.parse
        msg = (
            f"✅ تأكيد حجز — {tenant.name}\n"
            f"الاسم: {obj.customer_name}\n"
            f"الهاتف: {obj.customer_phone}\n"
            f"عدد الأشخاص: {obj.party_size}\n"
            f"الموعد: {obj.reserved_at.strftime('%Y-%m-%d %H:%M')}\n"
            f"الحالة: {obj.get_status_display()}"
        )
        return f"https://wa.me/{tenant.whatsapp_number}?text={urllib.parse.quote(msg)}"


class WaitlistEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WaitlistEntry
        fields = ['id', 'customer_name', 'customer_phone', 'party_size', 'status', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class MenuItemVariantWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemVariant
        fields = ['id', 'menu_item', 'name', 'name_en', 'price']
        read_only_fields = ['id']


class AddonWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Addon
        fields = ['id', 'group', 'name', 'name_en', 'price']
        read_only_fields = ['id']


class AddonGroupWriteSerializer(serializers.ModelSerializer):
    addons = AddonWriteSerializer(many=True, required=False)

    class Meta:
        model = AddonGroup
        fields = ['id', 'menu_item', 'name', 'name_en', 'min_selection', 'max_selection', 'addons']
        read_only_fields = ['id']

    def create(self, validated_data):
        addons_data = validated_data.pop('addons', [])
        group = AddonGroup.objects.create(**validated_data)
        for addon in addons_data:
            Addon.objects.create(group=group, **addon)
        return group


class ReorderSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.DictField(),
        help_text='[{"id": 1, "order": 0}, ...]',
    )


class PlatformRestaurantSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'slug', 'owner_username', 'is_active',
            'subscription_status', 'subscription_plan', 'subscription_expires_at',
            'custom_domain', 'landing_theme', 'hide_platform_branding',
            'latitude', 'longitude', 'phone', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'owner_username', 'created_at']


class PlatformSubscriptionPatchSerializer(serializers.Serializer):
    subscription_status = serializers.ChoiceField(
        choices=['trial', 'active', 'suspended', 'cancelled'], required=False,
    )
    subscription_plan = serializers.CharField(max_length=50, required=False)
    extend_days = serializers.IntegerField(min_value=1, max_value=365, required=False)
    is_active = serializers.BooleanField(required=False)
