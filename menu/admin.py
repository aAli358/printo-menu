from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline, StackedInline
from django.utils.html import format_html

from .admin_tenancy import RestaurantOwnerAdminMixin, TenantAdminMixin, SuperAdminOnlyMixin, MenuItemRelatedAdminMixin
from .models import (
    Restaurant, Category, MenuItem, MenuItemVariant, AddonGroup, Addon,
    OpeningHours, MenuItemReview, ExperienceReview, TableCall, Order, OrderItem, RestaurantTable,
    EnterpriseContact, PlatformSettings, AuthHandoff, Promotion, TableReservation, WaitlistEntry,
)


class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('menu_item', 'quantity', 'price')


@admin.register(Order)
class OrderAdmin(TenantAdminMixin, ModelAdmin):
    list_display = ('id', 'tenant', 'table_number', 'access_source', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'access_source', 'tenant', 'created_at')
    inlines = [OrderItemInline]
    readonly_fields = ('created_at',)
    list_full_width = True


class OpeningHoursInline(TabularInline):
    model = OpeningHours
    extra = 1


@admin.register(OpeningHours)
class OpeningHoursAdmin(TenantAdminMixin, ModelAdmin):
    list_display = ('tenant', 'day', 'open_time', 'close_time', 'is_closed')
    list_filter = ('tenant', 'day', 'is_closed')


MENU_THEME_LAYOUTS = {
    'modern-indigo': 'بطاقات أفقية + كاروسيل مميز + شريط أقسام',
    'classic-gold': 'قائمة فاخرة بدون صور كبيرة — اسم ووصف وسعر',
    'emerald-fresh': 'شبكة صور 2×2 + أقسام ببانر ملون + bento',
    'rose-boutique': 'بطاقات عمودية بصورة كاملة العرض',
    'ocean-blue': 'أصناف بعرض الشاشة + تبويبات أقسام',
    'sunset-warm': 'شبكة عائلية 2 أعمدة + بطاقات دافئة',
    'midnight-lounge': 'بلاطات مضغوطة 3 أعمدة — أسلوب lounge',
    'minimal-mono': 'نص فقط بخطوط فاصلة — بدون صور',
    'arabesque': 'تناوب صورة/نص (zigzag) + زخارف تراثية',
    'coffee-roast': 'بلاطات كafe صغيرة + شبكة مميز',
}


@admin.register(Restaurant)
class RestaurantAdmin(RestaurantOwnerAdminMixin, ModelAdmin):
    list_display = (
        'name', 'owner', 'subscription_status', 'display_menu_theme',
        'display_qr_code', 'display_access_mode', 'is_active', 'created_at',
    )
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [OpeningHoursInline]
    readonly_fields = ('display_qr_full', 'nfc_link_info', 'display_theme_layout_info')
    fieldsets = (
        ("المعلومات الأساسية", {
            "fields": (("name", "name_en"), "slug", "owner", "access_mode", "is_active", ("description", "description_en")),
        }),
        ("الاشتراك (Super Admin)", {
            "classes": ["tab"],
            "fields": (
                ("subscription_status", "subscription_plan"),
                "subscription_expires_at",
                "hide_platform_branding",
                "custom_domain",
                "landing_theme",
            ),
            "description": "إدارة حالة الاشتراك — مرئية لمدير المنصة فقط. «دومين مخصص»: مثل menu.alshams.com (بدون https://). فعّل «إخفاء شعار المنصة» لمطاعm Enterprise.",
        }),
        ("بيانات التواصل والعملة", {
            "fields": (("phone", "whatsapp_number"), "notification_email", "address", "currency_code"),
        }),
        ("الهوية البصرية (Branding)", {
            "classes": ["tab"],
            "fields": (("primary_color", "secondary_color"), "menu_theme", "display_theme_layout_info", "font_family", "theme_mode", ("logo", "cover_image")),
            "description": "ثيم المنيو يحدد التصميم الكامل الذي يراه الزبون.",
        }),
        ("الهوية الرقمية (QR & NFC)", {
            "classes": ["tab"],
            "fields": ("qr_color", "display_qr_full"),
        }),
    )

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if not request.user.is_superuser:
            return [fs for fs in fieldsets if fs[0] != "الاشتراك (Super Admin)"]
        return fieldsets

    def display_menu_theme(self, obj):
        themes = dict(Restaurant.MENU_THEMES)
        label = themes.get(obj.menu_theme, obj.menu_theme)
        colors = {
            'modern-indigo': '#6366f1', 'classic-gold': '#d4af37', 'emerald-fresh': '#059669',
            'rose-boutique': '#e11d48', 'ocean-blue': '#0284c7', 'sunset-warm': '#ea580c',
            'midnight-lounge': '#8b5cf6', 'minimal-mono': '#171717', 'arabesque': '#b45309',
            'coffee-roast': '#78350f',
        }
        color = colors.get(obj.menu_theme, '#6366f1')
        return format_html(
            '<span style="background:{}; color:white; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:bold;">{}</span>',
            color, label,
        )
    display_menu_theme.short_description = "ثيم المنيو"

    def display_theme_layout_info(self, obj):
        if not obj or not obj.menu_theme:
            return "—"
        desc = MENU_THEME_LAYOUTS.get(obj.menu_theme, '')
        preview = f"http://127.0.0.1:5173/?r={obj.slug}&table=1" if obj.slug else '#'
        return format_html(
            '<div style="padding:12px 16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;max-width:480px;">'
            '<p style="margin:0 0 8px;font-weight:600;color:#334155;">📐 تصميم المنيو للزبون:</p>'
            '<p style="margin:0 0 10px;color:#64748b;font-size:13px;">{}</p>'
            '<a href="{}" target="_blank" style="color:#6366f1;font-size:12px;font-weight:600;">↗ معاينة المنيو</a>'
            '</div>',
            desc, preview,
        )
    display_theme_layout_info.short_description = "معاينة التصميم"

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        formfield = super().formfield_for_dbfield(db_field, request, **kwargs)
        if db_field.name == 'menu_theme':
            choices = [(k, f"{v} — {MENU_THEME_LAYOUTS.get(k, '')}") for k, v in Restaurant.MENU_THEMES]
            formfield.choices = choices
        return formfield

    def display_access_mode(self, obj):
        color = "#10b981" if obj.access_mode == 'general' else "#6366f1"
        label = dict(Restaurant.ACCESS_MODES).get(obj.access_mode)
        return format_html(
            '<span style="background: {}; color: white; padding: 4px 10px; border-radius: 20px; font-weight: bold; font-size: 11px;">{}</span>',
            color, label,
        )
    display_access_mode.short_description = "وضع التشغيل"

    def display_qr_code(self, obj):
        if obj.qr_code:
            return format_html('<img src="{}" width="40" height="40" style="border-radius: 4px;" />', obj.qr_code.url)
        return "N/A"
    display_qr_code.short_description = "QR Code"

    def display_qr_full(self, obj):
        if not obj or not obj.qr_code:
            return format_html(
                '<div class="p-6 bg-amber-50 text-amber-800 border-2 border-amber-200 rounded-3xl font-bold flex items-center gap-3">'
                '<span class="material-symbols-outlined text-2xl">info</span> يرجى حفظ بيانات المطعم أولاً ليتم إنشاء الروابط والـ QR تلقائياً.</div>',
            )

        qr_img_html = format_html(
            '<div class="group relative inline-block transition-transform hover:scale-[1.02]">'
            '<div class="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>'
            '<div class="relative bg-white dark:bg-gray-900 p-6 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 shadow-2xl">'
            '<img src="{}" className="w-48 h-48 md:w-64 md:h-64 object-contain mx-auto" style="width: 220px; height: 220px;" />'
            '<div class="mt-4 text-center">'
            '<span class="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">General QR Code</span>'
            '</div>'
            '</div>'
            '</div>',
            obj.qr_code.url,
        )

        nfc_url = obj.get_nfc_url()
        download_url = f"/api/v1/restaurants/{obj.slug}/download_qrs/"

        links_html = format_html(
            '<div class="w-full lg:max-w-md space-y-6">'
            '<div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 shadow-xl">'
            '<h4 class="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">'
            '<span class="material-symbols-outlined text-primary-500">settings_nfc</span> برمجة الـ NFC والتحميل'
            '</h4>'
            '<div class="space-y-4 mb-8">'
            '<div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700">'
            '<p class="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-tighter">رابط البرمجة (NFC Tag Link):</p>'
            '<code class="text-xs text-primary-600 font-bold break-all select-all">{}</code>'
            '</div>'
            '</div>'
            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">'
            '<a href="{}" target="_blank" class="flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-primary-500/20 active:scale-95 text-sm">'
            '<span class="material-symbols-outlined">picture_as_pdf</span> تحميل PDF الطاولات'
            '</a>'
            '<a href="{}" target="_blank" class="flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-black transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 text-sm">'
            '<span class="material-symbols-outlined">visibility</span> عرض المباشر'
            '</a>'
            '</div>'
            '</div>'
            '<div class="p-6 {} rounded-[2rem] border-2 {} flex items-center justify-between shadow-sm">'
            '<div>'
            '<p class="text-[10px] font-black uppercase tracking-widest opacity-60">وضع التشغيل الحالي</p>'
            '<p class="text-lg font-black mt-1">{}</p>'
            '</div>'
            '<span class="material-symbols-outlined text-3xl opacity-40">{}</span>'
            '</div>'
            '</div>',
            nfc_url,
            download_url,
            obj.full_menu_url,
            "bg-indigo-50 dark:bg-indigo-900/10" if obj.access_mode == 'table_specific' else "bg-emerald-50 dark:bg-emerald-900/10",
            "border-indigo-100 dark:border-indigo-800" if obj.access_mode == 'table_specific' else "border-emerald-100 dark:border-emerald-800",
            dict(Restaurant.ACCESS_MODES).get(obj.access_mode),
            "table_restaurant" if obj.access_mode == 'table_specific' else "public",
        )

        return format_html('<div class="flex flex-col lg:flex-row gap-10 items-start p-2">{} {}</div>', qr_img_html, links_html)
    display_qr_full.short_description = "إدارة الهوية الرقمية (NFC & QR)"

    def nfc_link_info(self, obj):
        if not obj or not obj.pk:
            return "Save to see links"
        nfc_url = obj.get_nfc_url()
        download_url = f"/api/v1/restaurants/{obj.slug}/download_qrs/"
        return format_html(
            '<div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1;">'
            '<p><b>رابط المنيو العام:</b> <br/><code style="color: #be185d;">{}</code></p>'
            '<p style="margin-top: 10px;"><a href="{}" target="_blank" style="color: #0ea5e9; font-weight: bold;">📥 تحميل PDF الطاولات</a></p>'
            '</div>',
            nfc_url, download_url,
        )
    nfc_link_info.short_description = "روابط الـ QR والـ NFC"

    list_filter = ("is_active", "subscription_status", "owner")
    list_full_width = True


class MenuItemVariantInline(TabularInline):
    model = MenuItemVariant
    extra = 1


class AddonInline(TabularInline):
    model = Addon
    extra = 1


class AddonGroupInline(StackedInline):
    model = AddonGroup
    extra = 1


@admin.register(MenuItem)
class MenuItemAdmin(TenantAdminMixin, ModelAdmin):
    list_display = ('name', 'category', 'tenant', 'base_price', 'is_available', 'order')
    list_filter = ('tenant', 'category', 'is_available')
    search_fields = ('name', 'description')
    inlines = [MenuItemVariantInline, AddonGroupInline]


@admin.register(Category)
class CategoryAdmin(TenantAdminMixin, ModelAdmin):
    list_display = ('name', 'tenant', 'order', 'is_active')
    list_filter = ('tenant',)
    ordering = ('tenant', 'order')


@admin.register(TableCall)
class TableCallAdmin(TenantAdminMixin, ModelAdmin):
    list_display = ('table_number', 'tenant', 'call_type', 'access_source', 'is_resolved', 'created_at')
    list_filter = ('is_resolved', 'access_source', 'tenant', 'call_type')


@admin.register(RestaurantTable)
class RestaurantTableAdmin(TenantAdminMixin, ModelAdmin):
    list_display = ('number', 'tenant', 'label', 'is_active')
    list_filter = ('tenant', 'is_active')


@admin.register(MenuItemReview)
class MenuItemReviewAdmin(TenantAdminMixin, ModelAdmin):
    list_display = ('item', 'rating', 'created_at')
    list_filter = ('rating', 'item')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(item__tenant__owner=request.user)



@admin.register(AddonGroup)
class AddonGroupAdmin(MenuItemRelatedAdminMixin, ModelAdmin):
    list_display = ('name', 'menu_item', 'min_selection', 'max_selection')
    list_filter = ('menu_item__tenant',)
    search_fields = ('name', 'menu_item__name')


@admin.register(Addon)
class AddonAdmin(MenuItemRelatedAdminMixin, ModelAdmin):
    list_display = ('name', 'group', 'price')
    list_filter = ('group__menu_item__tenant',)
    search_fields = ('name', 'group__name')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(group__menu_item__tenant__owner=request.user)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        from .models import AddonGroup
        if db_field.name == 'group' and not request.user.is_superuser:
            kwargs['queryset'] = AddonGroup.objects.filter(menu_item__tenant__owner=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(ExperienceReview)
class ExperienceReviewAdmin(TenantAdminMixin, ModelAdmin):
    list_display = ('tenant', 'rating', 'table_number', 'created_at')
    list_filter = ('rating', 'tenant', 'created_at')
    search_fields = ('comment', 'table_number')


@admin.register(Promotion)
class PromotionAdmin(TenantAdminMixin, ModelAdmin):
    list_display = ('name', 'tenant', 'promo_type', 'is_active', 'created_at')
    list_filter = ('promo_type', 'is_active', 'tenant')


@admin.register(TableReservation)
class TableReservationAdmin(TenantAdminMixin, ModelAdmin):
    list_display = ('customer_name', 'tenant', 'party_size', 'reserved_at', 'status')
    list_filter = ('status', 'tenant')


@admin.register(WaitlistEntry)
class WaitlistEntryAdmin(TenantAdminMixin, ModelAdmin):
    list_display = ('customer_name', 'tenant', 'party_size', 'status', 'created_at')
    list_filter = ('status', 'tenant')


@admin.register(AuthHandoff)
class AuthHandoffAdmin(SuperAdminOnlyMixin, ModelAdmin):
    list_display = ('code', 'expires_at', 'created_at')
    readonly_fields = ('code', 'access_token', 'refresh_token', 'user_data', 'restaurants_data', 'created_at', 'expires_at')


@admin.register(EnterpriseContact)
class EnterpriseContactAdmin(ModelAdmin):
    list_display = ('name', 'email', 'company', 'phone', 'is_handled', 'created_at')
    list_filter = ('is_handled', 'created_at')
    search_fields = ('name', 'email', 'company', 'message')
    readonly_fields = ('created_at',)
    list_editable = ('is_handled',)


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(SuperAdminOnlyMixin, ModelAdmin):
    list_display = ('platform_name', 'show_platform_branding', 'updated_at')

    def has_add_permission(self, request):
        return request.user.is_superuser and not PlatformSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    fieldsets = (
        ('شريط الحقوق في منيو الزبائن', {
            'fields': (
                'show_platform_branding',
                'platform_name',
                'platform_logo_url',
                'platform_website_url',
            ),
            'description': (
                'يظهر في أسفل منيو كل مطعم: «صُمم بكل حب بواسطة …» مع الشعار والرابط. '
                'يمكن إخفاؤه لمطاعم Enterprise من صفحة المطعm.'
            ),
        }),
    )
