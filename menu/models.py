from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
import qrcode
from io import BytesIO
from django.core.files import File


class Restaurant(models.Model):
    """
    Tenant root model — each row = one restaurant on the shared SaaS platform.
    """
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='restaurants', verbose_name="المالك")
    name = models.CharField("اسم المطعم (عربي)", max_length=255)
    name_en = models.CharField("اسم المطعم (En)", max_length=255, blank=True)
    slug = models.SlugField("رابط فريد (Slug)", unique=True, blank=True)
    logo = models.ImageField("الشعار (Logo)", upload_to='restaurant_logos/', null=True, blank=True)
    cover_image = models.ImageField("صورة الغلاف (Banner)", upload_to='restaurant_covers/', null=True, blank=True)
    description = models.TextField("وصف المطعم (عربي)", blank=True)
    description_en = models.TextField("وصف المطعم (En)", blank=True)
    phone = models.CharField("رقم الهاتف", max_length=20, blank=True)
    whatsapp_number = models.CharField("رقم الواتساب (للطلبات)", max_length=20, blank=True, help_text="Ex: 9647700000000")
    address = models.TextField("العنوان", blank=True)
    currency_code = models.CharField("رمز العملة", max_length=10, default="د.ع")

    primary_color = models.CharField("اللون الأساسي", max_length=7, default='#000000')
    secondary_color = models.CharField("اللون الثانوي", max_length=7, default='#FFFFFF')
    font_family = models.CharField("نوع الخط", max_length=50, default='Tajawal')
    theme_mode = models.CharField("وضع الثيم", max_length=10, choices=[('light', 'فاتح'), ('dark', 'داكن')], default='light')

    MENU_THEMES = [
        ('modern-indigo', 'عصري بنفسجي'),
        ('classic-gold', 'فاخر ذهبي'),
        ('emerald-fresh', 'أخضر طازج'),
        ('rose-boutique', 'وردي بوتيك'),
        ('ocean-blue', 'أزرق بحري'),
        ('sunset-warm', 'غروب دافئ'),
        ('midnight-lounge', 'Lounge ليلي'),
        ('minimal-mono', 'Minimal أبيض'),
        ('arabesque', 'عراقي تراثي'),
        ('coffee-roast', 'قهوة داكنة'),
    ]
    menu_theme = models.CharField("ثيم المنيو", max_length=30, choices=MENU_THEMES, default='modern-indigo')

    qr_code = models.ImageField("رمز QR", upload_to='qr_codes/', blank=True, null=True)
    qr_color = models.CharField("لون الـ QR", max_length=7, default='#000000')

    is_active = models.BooleanField("نشط", default=True)

    SUBSCRIPTION_STATUSES = [
        ('trial', 'تجريبي'),
        ('active', 'نشط'),
        ('suspended', 'موقوف'),
        ('cancelled', 'ملغي'),
    ]
    subscription_status = models.CharField(
        "حالة الاشتراك", max_length=20, choices=SUBSCRIPTION_STATUSES, default='trial', db_index=True,
    )
    subscription_plan = models.CharField("خطة الاشتراك", max_length=50, default='basic', blank=True)
    subscription_expires_at = models.DateTimeField("انتهاء الاشتراك", null=True, blank=True)
    hide_platform_branding = models.BooleanField(
        "إخفاء شعار المنصة (Enterprise)",
        default=False,
        help_text="للمطاعم المؤسسية التي دفعت لإزالة «صُمم بواسطة برنتو» من المنيو.",
    )

    LANDING_THEMES = [
        ('default', 'افتراضي'),
        ('luxury', 'فاخر'),
        ('minimal', 'Minimal'),
        ('heritage', 'تراثي'),
    ]
    custom_domain = models.CharField(
        "دومين مخصص", max_length=255, blank=True, null=True, unique=True,
        help_text="مثال: menu.alshams.com",
    )
    landing_theme = models.CharField("ثيم Landing", max_length=30, choices=LANDING_THEMES, default='default')
    latitude = models.DecimalField("خط العرض", max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField("خط الطول", max_digits=9, decimal_places=6, null=True, blank=True)

    ACCESS_MODES = [
        ('table_specific', 'نظام الطاولات المنفصلة (Per-Table)'),
        ('general', 'نظام المنيو العام (General Menu)'),
    ]
    access_mode = models.CharField("نظام الوصول", max_length=20, choices=ACCESS_MODES, default='table_specific')

    created_at = models.DateTimeField("تاريخ الإنشاء", auto_now_add=True)

    class Meta:
        verbose_name = "مطعم (Tenant)"
        verbose_name_plural = "1. إدارة المطاعm — SaaS"
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active', 'subscription_status']),
        ]

    @property
    def subdomain_host(self) -> str:
        base = getattr(settings, 'EMENU_BASE_DOMAIN', 'localhost:5173')
        if ':' in base:
            domain, port = base.rsplit(':', 1)
            return f'{self.slug}.{domain}:{port}'
        return f'{self.slug}.{base}'

    @property
    def full_menu_url(self):
        protocol = 'http' if settings.DEBUG else 'https'
        return f'{protocol}://{self.subdomain_host}/'

    def get_qr_url(self, table_id=None):
        url = f'{self.full_menu_url}?source=qr'
        if table_id:
            url += f'&table={table_id}'
        return url

    def get_nfc_url(self, table_id=None):
        url = f'{self.full_menu_url}?source=nfc'
        if table_id:
            url += f'&table={table_id}'
        return url

    def save(self, *args, **kwargs):
        if not self.slug or '/' in self.slug or 'http' in self.slug:
            self.slug = slugify(self.name)
        original_slug = self.slug
        count = 1
        while Restaurant.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
            self.slug = f"{original_slug}-{count}"
            count += 1

        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
        qr.add_data(self.get_qr_url())
        qr.make(fit=True)
        img = qr.make_image(fill_color=self.qr_color, back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        self.qr_code.save(f"qr-{self.slug}.png", File(buffer), save=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class RestaurantTable(models.Model):
    tenant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='tables',
        db_column='tenant_id', db_index=True, verbose_name="المطعm (Tenant)",
    )
    number = models.CharField("رقم الطاولة", max_length=10)
    label = models.CharField("تسمية", max_length=50, blank=True)
    is_active = models.BooleanField("نشط", default=True)

    class Meta:
        verbose_name = "طاولة"
        verbose_name_plural = "الطاولات"
        unique_together = ('tenant', 'number')
        indexes = [models.Index(fields=['tenant', 'is_active'])]

    def __str__(self):
        return f"{self.tenant.slug} — Table {self.number}"


class OpeningHours(models.Model):
    DAYS = [(0, 'الاثنين'), (1, 'الثلاثاء'), (2, 'الأربعاء'), (3, 'الخميس'), (4, 'الجمعة'), (5, 'السبت'), (6, 'الأحد')]
    tenant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='opening_hours',
        db_column='tenant_id', db_index=True, verbose_name="المطعm (Tenant)",
    )
    day = models.IntegerField("اليوم", choices=DAYS)
    open_time = models.TimeField("وقت الافتتاح")
    close_time = models.TimeField("وقت الإغلاق")
    is_closed = models.BooleanField("مغلق", default=False)

    class Meta:
        verbose_name = "ساعة عمل"
        verbose_name_plural = "ساعات العمل"
        unique_together = ('tenant', 'day')


class Category(models.Model):
    tenant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='categories',
        db_column='tenant_id', db_index=True, verbose_name="المطعm (Tenant)",
    )
    name = models.CharField("اسم القسم (عربي)", max_length=100)
    name_en = models.CharField("اسم القسم (En)", max_length=100, blank=True)
    icon = models.ImageField("أيقونة القسم", upload_to='category_icons/', null=True, blank=True)
    order = models.PositiveIntegerField("الترتيب", default=0)
    is_active = models.BooleanField("نشط", default=True)

    class Meta:
        verbose_name = "قسم"
        verbose_name_plural = "2. الأقسام والتصنيفات"
        ordering = ['order']
        indexes = [
            models.Index(fields=['tenant', 'order']),
            models.Index(fields=['tenant', 'is_active']),
        ]

    def __str__(self):
        return f"{self.tenant.name} - {self.name}"


class MenuItem(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items', verbose_name="القسم")
    tenant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='menu_items',
        db_column='tenant_id', db_index=True, verbose_name="المطعm (Tenant)",
    )
    name = models.CharField("اسم الصنف (عربي)", max_length=255)
    name_en = models.CharField("اسم الصنف (En)", max_length=255, blank=True)
    description = models.TextField("الوصف (عربي)", blank=True)
    description_en = models.TextField("الوصف (En)", blank=True)
    image = models.ImageField("صورة الصنف", upload_to='menu_items/', null=True, blank=True)
    base_price = models.DecimalField("السعر الأساسي", max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    is_available = models.BooleanField("متوفر", default=True)
    tags = models.JSONField("تاغات (Spicy, Vegan...)", default=list, blank=True)
    order = models.PositiveIntegerField("الترتيب", default=0)

    class Meta:
        verbose_name = "صنف"
        verbose_name_plural = "3. قائمة الأصناف"
        ordering = ['order']
        indexes = [models.Index(fields=['tenant', 'is_available'])]

    @property
    def average_rating(self):
        return self.reviews.aggregate(models.Avg('rating'))['rating__avg'] or 0

    def save(self, *args, **kwargs):
        if self.category_id and not self.tenant_id:
            self.tenant_id = Category.objects.filter(pk=self.category_id).values_list('tenant_id', flat=True).first()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class MenuItemReview(models.Model):
    item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='reviews', verbose_name="الصنف")
    rating = models.PositiveIntegerField("التقييم (1-5)", validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField("التعليق", blank=True)
    created_at = models.DateTimeField("التاريخ", auto_now_add=True)

    class Meta:
        verbose_name = "تقييم"
        verbose_name_plural = "5. تقييمات الزبائن"


class ExperienceReview(models.Model):
    """Overall restaurant experience rating from customers."""
    tenant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='experience_reviews',
        db_column='tenant_id', db_index=True, verbose_name="المطعm (Tenant)",
    )
    rating = models.PositiveIntegerField(
        "التقييم (1-5)", validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField("التعليق", blank=True)
    table_number = models.CharField("رقم الطاولة", max_length=20, blank=True)
    created_at = models.DateTimeField("التاريخ", auto_now_add=True)

    class Meta:
        verbose_name = "تقييم تجربة"
        verbose_name_plural = "تقييمات التجربة"
        ordering = ['-created_at']
        indexes = [models.Index(fields=['tenant', '-created_at'])]


class AuthHandoff(models.Model):
    """One-time code for secure cross-subdomain session transfer (replaces JWT in URL hash)."""
    code = models.CharField(max_length=64, unique=True, db_index=True)
    access_token = models.TextField()
    refresh_token = models.TextField()
    user_data = models.JSONField()
    restaurants_data = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
        verbose_name = "رمز تسليم الجلسة"
        verbose_name_plural = "رموز تسليم الجلسة"
        indexes = [models.Index(fields=['expires_at'])]


class MenuItemVariant(models.Model):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='variants', verbose_name="الصنف")
    name = models.CharField("اسم الحجم/النوع", max_length=100)
    name_en = models.CharField("الاسم (En)", max_length=100, blank=True)
    price = models.DecimalField("السعر", max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        verbose_name = "حجم/نوع"
        verbose_name_plural = "أحجام الأصناف"


class AddonGroup(models.Model):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='addon_groups', verbose_name="الصنف")
    name = models.CharField("اسم مجموعة الإضافات", max_length=100)
    name_en = models.CharField("الاسم (En)", max_length=100, blank=True)
    min_selection = models.IntegerField("الحد الأدنى للاختيار", default=0)
    max_selection = models.IntegerField("الحد الأقصى للاختيار", default=1)

    class Meta:
        verbose_name = "مجموعة إضافات"
        verbose_name_plural = "مجموعات الإضافات"


class Addon(models.Model):
    group = models.ForeignKey(AddonGroup, on_delete=models.CASCADE, related_name='addons', verbose_name="المجموعة")
    name = models.CharField("اسم الإضافة", max_length=100)
    name_en = models.CharField("الاسم (En)", max_length=100, blank=True)
    price = models.DecimalField("السعر الإضافي", max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])

    class Meta:
        verbose_name = "إضافة"
        verbose_name_plural = "الإضافات"


class TableCall(models.Model):
    CALL_TYPES = [('waiter', 'طلب نادل'), ('bill', 'طلب الحساب'), ('other', 'أخرى')]
    tenant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='table_calls',
        db_column='tenant_id', db_index=True, verbose_name="المطعm (Tenant)",
    )
    table_number = models.CharField("رقم الطاولة", max_length=10)
    call_type = models.CharField("نوع الطلب", max_length=10, choices=CALL_TYPES, default='waiter')
    access_source = models.CharField("المصدر", max_length=10, choices=[('qr', 'QR'), ('nfc', 'NFC')], blank=True)
    is_resolved = models.BooleanField("تمت الاستجابة", default=False)
    created_at = models.DateTimeField("وقت الطلب", auto_now_add=True)

    class Meta:
        verbose_name = "طلب طاولة"
        verbose_name_plural = "4. طلبات المساعدة"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'قيد الانتظار'),
        ('preparing', 'قيد التحضير'),
        ('ready', 'جاهز للتسليم'),
        ('completed', 'مكتمل'),
        ('cancelled', 'ملغى'),
    ]
    tenant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='orders',
        db_column='tenant_id', db_index=True, verbose_name="المطعm (Tenant)",
    )
    table_number = models.CharField("رقم الطاولة", max_length=10, blank=True)
    customer_name = models.CharField("اسم الزبون", max_length=100, blank=True)
    customer_phone = models.CharField("رقم الزبون", max_length=20, blank=True)
    access_source = models.CharField("المصدر", max_length=10, choices=[('qr', 'QR'), ('nfc', 'NFC')], blank=True)
    total_amount = models.DecimalField("إجمالي المبلغ", max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField("قيمة الخصم", max_digits=10, decimal_places=2, default=0)
    coupon_code = models.CharField("كود الكوبون", max_length=50, blank=True)
    status = models.CharField("حالة الطلب", max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField("وقت الطلب", auto_now_add=True)
    preparing_at = models.DateTimeField("بدء التحضير", null=True, blank=True)
    ready_at = models.DateTimeField("جاهز للتسليم", null=True, blank=True)
    completed_at = models.DateTimeField("اكتمال الطلب", null=True, blank=True)

    class Meta:
        verbose_name = "طلب مبيعات"
        verbose_name_plural = "6. سجل المبيعات"
        ordering = ['created_at']
        indexes = [models.Index(fields=['tenant', 'status'])]

    def __str__(self):
        return f"طلب #{self.id} - {self.tenant.name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name="الطلب")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True, verbose_name="الصنف")
    quantity = models.PositiveIntegerField("الكمية", default=1)
    price = models.DecimalField("السعر عند الطلب", max_digits=10, decimal_places=2)
    modifiers_text = models.TextField("التعديلات (حجم وإضافات)", blank=True)

    class Meta:
        verbose_name = "صنف مطلوب"
        verbose_name_plural = "أصناف الطلبات"


class Promotion(models.Model):
    PROMO_TYPES = [
        ('happy_hour', 'Happy Hour'),
        ('category_discount', 'خصم على قسم'),
        ('buy_x_get_y', 'اشترِ X واحصل على Y'),
        ('coupon', 'كوبون'),
    ]
    tenant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='promotions',
        db_column='tenant_id', db_index=True,
    )
    name = models.CharField(max_length=255)
    promo_type = models.CharField(max_length=30, choices=PROMO_TYPES)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category = models.ForeignKey(
        'Category', on_delete=models.CASCADE, null=True, blank=True, related_name='promotions',
    )
    buy_quantity = models.PositiveIntegerField(null=True, blank=True)
    get_quantity = models.PositiveIntegerField(null=True, blank=True)
    coupon_code = models.CharField(max_length=50, blank=True, db_index=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    days_of_week = models.JSONField(default=list, blank=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "عرض / خصم"
        verbose_name_plural = "العروض والخصومات"
        ordering = ['-created_at']


class TableReservation(models.Model):
    STATUSES = [
        ('pending', 'قيد الانتظار'),
        ('confirmed', 'مؤكد'),
        ('cancelled', 'ملغى'),
        ('completed', 'مكتمل'),
    ]
    tenant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='reservations',
        db_column='tenant_id', db_index=True,
    )
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=20)
    party_size = models.PositiveIntegerField(default=2)
    reserved_at = models.DateTimeField()
    table_number = models.CharField(max_length=10, blank=True)
    status = models.CharField(max_length=20, choices=STATUSES, default='pending')
    notes = models.TextField(blank=True)
    whatsapp_notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "حجز طاولة"
        verbose_name_plural = "حجوزات الطاولات"
        ordering = ['reserved_at']


class WaitlistEntry(models.Model):
    STATUSES = [
        ('waiting', 'بالانتظار'),
        ('seated', 'تم الجلوس'),
        ('cancelled', 'ملغى'),
    ]
    tenant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='waitlist_entries',
        db_column='tenant_id', db_index=True,
    )
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=20)
    party_size = models.PositiveIntegerField(default=2)
    status = models.CharField(max_length=20, choices=STATUSES, default='waiting')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "قائمة انتظار"
        verbose_name_plural = "قوائم الانتظار"
        ordering = ['created_at']


class EnterpriseContact(models.Model):
    PLAN_CHOICES = [('enterprise', 'مؤسسات')]

    name = models.CharField('الاسم', max_length=255)
    email = models.EmailField('البريد')
    phone = models.CharField('الهاتف', max_length=30, blank=True)
    company = models.CharField('اسم المؤسسة / المطعm', max_length=255, blank=True)
    message = models.TextField('الرسالة')
    plan = models.CharField('الخطة', max_length=30, choices=PLAN_CHOICES, default='enterprise')
    is_handled = models.BooleanField('تمت المعالجة', default=False)
    created_at = models.DateTimeField('تاريخ الطلب', auto_now_add=True)

    class Meta:
        verbose_name = 'طلب خطة مؤسسات'
        verbose_name_plural = 'طلبات الخطط المؤسسية'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} — {self.company or self.email}'


class PlatformSettings(models.Model):
    """Singleton — global SaaS branding shown on customer menus."""

    singleton_key = models.PositiveSmallIntegerField(default=1, unique=True, editable=False)
    platform_name = models.CharField(
        'اسم المنصة / الشركة',
        max_length=255,
        default='شركة برنتو للحلول الذكية',
    )
    platform_logo_url = models.URLField(
        'رابط شعار المنصة',
        blank=True,
        help_text='رابط مباشر لشعار برنتو (PNG/SVG).',
    )
    platform_website_url = models.URLField(
        'رابط صفحة برنتو',
        blank=True,
        help_text='فيسبوك، إنستغرام، واتساب، أو الموقع الرسمي.',
    )
    show_platform_branding = models.BooleanField(
        'إظهار شريط الحقوق في المنيو',
        default=True,
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'إعدادات المنصة (Branding)'
        verbose_name_plural = 'إعدادات المنصة (Branding)'

    def __str__(self):
        return self.platform_name

    def save(self, *args, **kwargs):
        self.singleton_key = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(
            singleton_key=1,
            defaults={
                'platform_name': 'شركة برنتو للحلول الذكية',
                'show_platform_branding': True,
            },
        )
        return obj
