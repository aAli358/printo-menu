# 📖 دليل المستخدم الشامل — E-Menu Pro

> **الإصدار:** 1.0  
> **آخر تحديث:** سبتمبر 2026  
> **اللغة:** العربية (مع مصطلحات تقنية بالإنجليزية حيث يلزم)

---

## جدول المحتويات

1. [ما هو E-Menu Pro؟](#1-ما-هو-e-menu-pro)
2. [من يستهدف النظام؟](#2-من-يستهدف-النظام)
3. [البنية العامة للمنصة](#3-البنية-العامة-للمنصة)
4. [البدء السريع — من الصفر إلى منيو جاهز](#4-البدء-السريع--من-الصفر-إلى-منيو-جاهز)
5. [الأدوار والصلاحيات](#5-الأدوار-والصلاحيات)
6. [خطط الاشتراك والتسعير](#6-خطط-الاشتراك-والتسعير)
7. [دليل صاحب المطعم — لوحة التحكم](#7-دليل-صاحب-المطعم--لوحة-التحكم)
8. [محرر المنيو — شرح تفصيلي](#8-محرر-المنيو--شرح-تفصيلي)
9. [الهوية البصرية والثيمات](#9-الهوية-البصرية-والثيمات)
10. [الطاولات و QR و Barcode](#10-الطاولات-و-qr-و-barcode)
11. [العروض والخصومات](#11-العروض-والخصومات)
12. [الحجوزات وقائمة الانتظار](#12-الحجوزات-وقائمة-الانتظار)
13. [لوحة الإحصائيات والتحليلات](#13-لوحة-الإحصائيات-والتحليلات)
14. [شاشة المطبخ (Kitchen Display)](#14-شاشة-المطبخ-kitchen-display)
15. [دليل العميل — تجربة المنيو الرقمي](#15-دليل-العميل--تجربة-المنيو-الرقمي)
16. [مدير المنصة (Super Admin)](#16-مدير-المنصة-super-admin)
17. [White-Label والدومين المخصص](#17-white-label-والدومين-المخصص)
18. [المصادقة والأمان](#18-المصادقة-والأمان)
19. [التشغيل والنشر التقني](#19-التشغيل-والنشر-التقني)
20. [مرجع الروابط والمسارات](#20-مرجع-الروابط-والمسارات)
21. [الأسئلة الشائعة (FAQ)](#21-الأسئلة-الشائعة-faq)
22. [ملحق: قائمة API الرئيسية](#22-ملحق-قائمة-api-الرئيسية)

---

# 1. ما هو E-Menu Pro؟

**E-Menu Pro** منصة **SaaS** (Software as a Service) متعددة المستأجرين، مصممة خصيصاً للمطاعم والكافيهات والمقاهي والمخابز وصالات الطعام. تتيح للمطعم:

- إنشاء **منيو رقمي تفاعلي** يعمل على الجوال
- توليد **رموز QR و Barcode** للطاولات
- استقبال **طلبات مباشرة** من الزبائن
- إدارة **شاشة مطبخ** فورية
- متابعة **إحصائيات ومبيعات**
- إطلاق **عروض وخصومات**
- استقبال **حجوزات وقائمة انتظار**
- تخصيص **الهوية البصرية** بـ 10 ثيمات جاهزة

### التقنيات الأساسية

| الطبقة | التقنية |
|--------|---------|
| Backend | Django 4.2 + Django REST Framework |
| Frontend | React 19 + Vite + Tailwind CSS |
| قاعدة البيانات | SQLite (تطوير) / PostgreSQL (إنتاج) |
| المصادقة | JWT (JSON Web Tokens) |
| الوقت الفعلي | Django Channels + WebSocket + Redis |
| النشر | Docker + Nginx + Certbot |

### الفكرة الأساسية

```
┌─────────────────────────────────────────────────────────────┐
│                    E-Menu Platform (SaaS)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  مطعم A     │  │  مطعم B     │  │  مطعم C     │  ...    │
│  │  shams.     │  │  cafe.      │  │  pizza.     │         │
│  │  emenu.com  │  │  emenu.com  │  │  emenu.com  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         ↑                ↑                ↑                 │
│    بيانات معزولة    بيانات معزولة    بيانات معزولة         │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
    QR الطاولة          QR الطاولة          QR الطاولة
         ↑                    ↑                    ↑
      الزبائن             الزبائن             الزبائن
```

كل مطعم = **مستأجر مستقل (Tenant)** ببياناته المعزولة، منيوه الخاص، وثيمه الخاص — على نفس المنصة.

---

# 2. من يستهدف النظام؟

## 2.1 أصحاب المطاعم والكافيهات (Tenant Owners)

**من هم:** أصحاب مطاعm، مديرو كافيهات، سلاسل طعام صغيرة ومتوسطة.

**ماذا يحصلون:**
- منيو رقمي احترافي بدون تطبيق
- QR للطاولات — الزبون يمسح ويطلب
- لوحة تحكم شاملة
- تقارير مبيعات
- 14 يوم تجربة مجانية

**أمثلة واقعية:**
- مطعم مشاوي عراقي → ثيم `arabesque`
- كافيه حديث → ثيم `modern-indigo` أو `coffee-roast`
- مطعم فاخر → ثيم `classic-gold`
- مطعم مأكولات بحرية → ثيم `ocean-blue`

---

## 2.2 موظفو المطبخ (Kitchen Staff)

**من هم:** طهاة، مساعدو مطبخ، مديرو صالة.

**ماذا يحصلون:**
- شاشة `/kitchen` تعرض الطلبات فوراً
- تنبيهات صوتية عند طلب جديد
- تتبع حالة كل طلب: قيد الانتظار → تحضير → جاهز → مكتمل
- إشعارات طلبات النادل (فاتورة / مساعدة)

---

## 2.3 العملاء / الزبائن (End Customers)

**من هم:** رواد المطعm الذين يجلسون على الطاولة أو يتصفحون المنيو.

**ماذا يحصلون:**
- مسح QR → فتح المنيو على الجوال
- تصفح الأصناف بالعربي أو الإنجليزي
- إضافة للسلة مع تخصيص (حجم، إضافات)
- إرسال الطلب للمطبخ
- حجز طاولة أو الانضمام لقائمة الانتظار
- تقييم التجربة
- طلب النادل

**لا يحتاجون:** حساب أو تسجيل — تجربة مباشرة.

---

## 2.4 مدير المنصة (Platform Super Admin)

**من هو:** مالك/مشغّل منصة E-Menu Pro نفسها.

**ماذا يحصل:**
- رؤية كل المطاعm المسجلة
- إدارة الاشتراكات (تفعيل / إيقاف / تمديد)
- إحصائيات المنصة (MRR، عدد المطاعm، الطلبات)
- الوصول لـ Django Admin الكامل

---

## 2.5 الزوار / المسوقون (Landing Visitors)

**من هم:** أصحاب مطاعm يبحثون عن حل منيو رقمي.

**ماذا يحصلون:**
- صفحة تسويقية `/`
- مقارنة الخطط والأسعار
- تسجيل تجريبي مجاني 14 يوم
- معاينة منيو تجريبي (`shams`)

---

# 3. البنية العامة للمنصة

## 3.1 الدومينات

| النوع | مثال | الاستخدام |
|-------|------|-----------|
| **Platform Root** | `emenu.com` أو `localhost:5173` | Landing + تسجيل + login |
| **Tenant Subdomain** | `shams.emenu.com` | منيو المطعm + dashboard |
| **Custom Domain** | `menu.alshams.com` | White-label (Enterprise) |

## 3.2 مسارات الواجهة

### على الدومين الرئيسي (`localhost:5173`)

| المسار | الوصف | من يصل |
|--------|-------|--------|
| `/` | الصفحة التسويقية | الجميع |
| `/login` | تسجيل دخول / إنشاء حساب | أصحاب مطاعm |
| `/dashboard` | لوحة تحكم المطعm | المالك (JWT) |
| `/kitchen` | شاشة المطبخ | الموظف (JWT) |
| `/platform` | إدارة المنصة | Super Admin |
| `/r/shams?table=1` | منيو عميل (legacy) | الزبائن |

### على subdomain المطعm (`shams.localhost:5173`)

| المسار | الوصف |
|--------|-------|
| `/` | **المنيو الرقمي** (الصفحة الافتراضية) |
| `/dashboard` | لوحة التحكم |
| `/kitchen` | شاشة المطبخ |
| `/login` | تسجيل الدخول |

---

# 4. البدء السريع — من الصفر إلى منيو جاهز

## الخطوة 1: إنشاء حساب مطعm

1. افتح `http://localhost:5173/` (أو دومين المنصة)
2. انزل لقسم **"ابدأ تجربتك المجانية"**
3. أدخل:
   - **اسم المطعm** (مثال: مطعم الشمس)
   - **اسم المستخدم** (مثال: shams_admin)
   - **البريد** (اختياري)
   - **كلمة المرور** (8 أحرف على الأقل)
4. اضغط **"ابدأ تجربتك المجانية — 14 يوم"**

**ماذا يحدث في الخلفية:**
- يُنشأ حساب User في Django
- يُنشأ Restaurant مرتبط بالمالك
- slug تلقائي من الاسم (مثال: `matam-alshams`)
- اشتراك `trial` لمدة **14 يوم**
- JWT tokens + redirect للـ dashboard

---

## الخطوة 2: إضافة أقسام وأصناف

1. من `/dashboard` → تبويب **"المنيو"**
2. اضغط **"+ قسم جديد"** → أدخل اسم القسم (مثال: مشاوي)
3. داخل القسم → **"+ صنف"**:
   - الاسم بالعربي والإنجليزي
   - الوصف
   - السعر
   - صورة (اختياري)
   - Tags: Spicy / Vegan / New
4. **اسحب وأفلت** الأقسام والأصناف لإعادة الترتيب

---

## الخطoة 3: اختيار الثيم

1. تبويب **"الهوية البصرية"**
2. اختر **ثيم المنيو** من القائمة
3. عدّل **اللون الأساسي** و **اللون الثانوي**
4. ارفع **الشعار** و **صورة الغلاف**
5. اضغط **"حفظ التغييرات"**

---

## الخطوة 4: توليد QR للطاولات

1. تبويب **"الطاولات & QR"**
2. اختر **نظام الوصول:**
   - **QR لكل طاولة** → للمطاعm بخدمة طاولات
   - **منيو عام واحد** → للكافيهات والتيك أواي
3. اضغط **"توليد طاولات (1-100)"** → أدخل العدد
4. حمّل:
   - **QR PNG** لكل طاولة
   - **PDF** لكل الطاولات دفعة واحدة
   - **Barcode 1D** للطابعات التقليدية

---

## الخطوة 5: معاينة المنيو

1. اضغط **"معاينة المنيو ↗"** في أعلى Dashboard
2. أو افتح: `http://shams.localhost:5173/?table=1`
3. جرّب إضافة صنف للسلة وإرسال طلب تجريبي

---

## الخطوة 6: تفعيل شاشة المطبخ

1. افتح `/kitchen` على tablet في المطبخ
2. سجّل دخول بنفس حساب المالك
3. الطلبات ستظهر فوراً مع تنبيه صوتي

---

# 5. الأدوار والصلاحيات

## 5.1 جدول الصلاحيات

| الإجراء | زائر | مالك مطعm | Super Admin |
|---------|------|-----------|-------------|
| قراءة المنيو العام | ✅ | ✅ | ✅ |
| إنشاء طلب | ✅ | ✅ | ✅ |
| تقييم / حجز / طلب نادل | ✅ | ✅ | ✅ |
| تعديل المنيو | ❌ | ✅ (مطعمه فقط) | ✅ |
| Analytics | ❌ | ✅ | ✅ |
| Platform Admin | ❌ | ❌ | ✅ |
| Django Admin | ❌ | ❌ | ✅ |
| إيقاف/تفعيل مطاعm | ❌ | ❌ | ✅ |

## 5.2 عزل البيانات (Tenant Isolation)

- كل مطعm يرى **بياناته فقط**
- API يتحقق من `tenant_id` في كل عملية كتابة
- Header `X-Tenant-Slug: shams` يحدد المستأجر في الطلبات العامة
- Subdomain يُحلّ تلقائياً إلى المستأجر

## 5.3 حالات الاشتراك وتأثيرها

| الحالة | الوصف | تأثير على العملاء |
|--------|-------|-------------------|
| `trial` | تجريبي 14 يوم | ✅ المنيو يعمل |
| `active` | اشتراك مدفوع | ✅ المنيو يعمل |
| `suspended` | موقوف | ❌ 403 — "المطعm موقوف" |
| `cancelled` | ملغي | ❌ غير متاح |

---

# 6. خطط الاشتراك والتسعير

## 6.1 الخطة الأساسية (Basic) — مجاني 14 يوم

| الميزة | متاح |
|--------|------|
| منيو رقمي | ✅ |
| QR للطاولات | ✅ |
| حتى 50 صنف | ✅ |
| دعم بريد | ✅ |
| شاشة مطبخ | ❌ |
| تقارير متقدمة | ❌ |
| 10 ثيمات | ❌ |

---

## 6.2 الخطة الاحترافية (Pro) — 49,000 د.ع/شهر

| الميزة | متاح |
|--------|------|
| كل ميزات الأساسي | ✅ |
| شاشة مطبخ فورية | ✅ |
| تقارير وإحصائيات | ✅ |
| 10 ثيمات منيو | ✅ |
| عروض وخصومات | ✅ |
| حجوزات | ✅ |
| دعم أولوية | ✅ |

---

## 6.3 خطة المؤسسات (Enterprise) — تواصل

| الميزة | متاح |
|--------|------|
| مطاعm متعددة | ✅ |
| API مخصص | ✅ |
| SLA مضمون | ✅ |
| مدير حساب | ✅ |
| White-label كامل | ✅ |
| دومين مخصص | ✅ |
| إخفاء branding المنصة | ✅ |

**للطلب:** زر "تواصل معنا" في Landing → `POST /api/v1/contact/`

---

## 6.4 التحذيرات والتجديد

- **7 أيام قبل انتهاء Trial:** تحذير أصفر في Dashboard
- **بعد الانتهاء:** Super Admin يمدّد أو يوقف
- **+30 يوم:** Super Admin يضغط من `/platform`

---

# 7. دليل صاحب المطعm — لوحة التحكم

**الوصول:** `/dashboard` (يتطلب JWT)

## 7.1 شريط التنقل العلوي

| الزر | الوظيفة |
|------|---------|
| **معاينة المنيو ↗** | فتح المنيو في tab جديد |
| **Super Admin** | (superuser فقط) → `/platform` |
| **شاشة المطبخ** | → `/kitchen` |
| **خروج** | إنهاء الجلسة |

## 7.2 التبويبات الستة

```
┌──────────────────────────────────────────────────────────┐
│  [المنيو] [الإحصائيات] [العروض] [الحجوزات] [الهوية] [QR] │
└──────────────────────────────────────────────────────────┘
```

| # | التبويب | الملف | الوظيفة |
|---|---------|-------|---------|
| 1 | المنيو | `MenuEditor.tsx` | CRUD أقسام وأصناف |
| 2 | الإحصائيات | `AnalyticsPanel.tsx` | تقارير ومبيعات |
| 3 | العروض | `PromotionsPanel.tsx` | خصومات وكوبونات |
| 4 | الحجوزات | `ReservationsPanel.tsx` | حجوزات + waitlist |
| 5 | الهوية البصرية | form في Dashboard | ألوان، ثيم، شعار |
| 6 | الطاولات & QR | tables section | QR/Barcode/PDF |

---

# 8. محرر المنيو — شرح تفصيلي

## 8.1 الأقسام (Categories)

**العمليات:**
- ➕ إنشاء قسم جديد
- ✏️ تعديل الاسم
- 🗑️ حذف (يحذف الأصناف معه)
- ↕️ **سحب وإفلات** لإعادة الترتيب

**API:**
- `GET/POST /api/v1/categories/`
- `POST /api/v1/categories/reorder/`

---

## 8.2 الأصناف (Menu Items)

**حقول كل صنف:**

| الحقل | الوصف | مثال |
|-------|-------|------|
| `name` | الاسم بالعربي | كباب لحم |
| `name_en` | الاسم بالإنجليزي | Lamb Kebab |
| `description` | وصف عربي | 300g لحم مشوي |
| `description_en` | وصف إنجليزي | 300g grilled lamb |
| `base_price` | السعر | 15000 |
| `image` | صورة الصنف | JPG/PNG |
| `is_available` | متاح/نفذ | toggle |
| `tags` | Spicy, Vegan, New | badges |
| `average_rating` | متوسط التقييم | تلقائي |

**العمليات:**
- ➕ إضافة صنف
- ✏️ تعديل
- 🗑️ حذف
- 🔄 toggle توفر (نفذ/متوفر)
- ↕️ إعادة ترتيب داخل القسم

**API:**
- `GET/POST/PATCH/DELETE /api/v1/items/`
- `POST /api/v1/items/{id}/toggle_stock/`
- `POST /api/v1/items/reorder/`

---

## 8.3 المتغيرات (Variants)

**الاستخدام:** أحجام مختلفة بأسعار مختلفة.

**مثال:**
```
صنف: عصير برتقال
├── Variant: صغير — 3,000 د.ع
├── Variant: وسط — 5,000 د.ع
└── Variant: كبير — 7,000 د.ع
```

**API:** `GET/POST/PATCH/DELETE /api/v1/variants/`

---

## 8.4 مجموعات الإضافات (Addon Groups)

**الاستخدام:** إضافات اختيارية على الصنف.

**مثال:**
```
صنف: برجر
└── Addon Group: "إضافات"
    ├── جبن (+2,000)
    ├── بصل (+500)
    └── صوص خاص (+1,000)
```

**API:** `GET/POST/PATCH/DELETE /api/v1/addon-groups/`

---

# 9. الهوية البصرية والثيمات

## 9.1 إعدادات Branding

| الإعداد | الوصف |
|---------|-------|
| **اللون الأساسي** | `--color-primary` في المنيو |
| **اللون الثانوي** | `--color-secondary` |
| **لون QR** | لون مربعات QR المطبوعة |
| **نظام الوصول** | Per-Table أو General |
| **ثيم المنيو** | 1 من 10 ثيمات |
| **ثيم Landing** | default / luxury / minimal / heritage |
| **الشعار (Logo)** | يظهر في Header + وسط QR |
| **صورة الغلاف** | Hero section |

**API:** `PATCH /api/v1/restaurants/{slug}/branding/`

---

## 9.2 الثيمات العشرة — دليل الاختيار

| # | ID | الاسم | الوضع | الأنسب لـ | تخطيط البطاقات |
|---|-----|-------|-------|-----------|----------------|
| 1 | `modern-indigo` | عصري بنفسجي | ☀️ Light | مطاعm عصرية، كافيهات | أفقي + Carousel |
| 2 | `classic-gold` | فاخر ذهبي | 🌙 Dark | fine dining، فنادق | Luxury row |
| 3 | `emerald-fresh` | أخضر طازج | ☀️ Light | صحي، سلطات، عصائر | Grid 2×2 + Bento |
| 4 | `rose-boutique` | وردي بوتيك | ☀️ Light | حلويات، بوتيكات | Full banner |
| 5 | `ocean-blue` | أزرق بحري | ☀️ Light | مأكولات بحرية | Full-width banners |
| 6 | `sunset-warm` | غروب دافئ | ☀️ Light | مشاوي، عائلي | Grid عمودين |
| 7 | `midnight-lounge` | Lounge ليلي | 🌙 Dark | صالات، كافيهات ليلية | Compact 3 أعمدة |
| 8 | `minimal-mono` | Minimal أبيض | ☀️ Light | brands عصرية | نص فقط |
| 9 | `arabesque` | عراقي تراثي | ☀️ Light | مشاوي، شرق أوسط | Zigzag + زخارف |
| 10 | `coffee-roast` | قهوة داكنة | ☀️ Light | كوفي شوب، مخابز | Compact tiles |

### كيف يُطبَّق الثيم؟

1. المالك يختار من Dashboard
2. عند فتح المنيو → API يرجع `menu_theme`
3. Frontend يطبّق CSS variables:
   ```css
   --color-primary: #6366f1;
   --color-surface: #f5f6ff;
   --font-brand: 'Tajawal', sans-serif;
   ```
4. `data-menu-theme="modern-indigo"` على `<html>`

### تبديل Light/Dark

- **العميل** يبدّل من Header (☀️/🌙)
- بعض الثيمات dark-by-default (`classic-gold`, `midnight-lounge`)

---

# 10. الطاولات و QR و Barcode

## 10.1 أوضاع الوصول

### Per-Table (QR لكل طاولة) — `table_specific`

```
الزبون يمسح QR الطاولة 5
    ↓
يفتح: shams.emenu.com/?table=5&source=qr
    ↓
المنيو يعرف رقم الطاولة تلقائياً
    ↓
الطلب يُرسل: "طاولة 5"
```

**بدون `?table=`:** رسالة "امسح QR على طاولتك"

### General (منيو عام) — `general`

```
QR واحد للمطعm
    ↓
shams.emenu.com/?source=qr
    ↓
الزبون يُدخل رقم الطاولة يدوياً (أو بدون)
```

---

## 10.2 توليد QR

**محتوى QR:**
```
https://shams.emenu.com/?source=qr&table=5
```

**مواصفات QR:**
- PNG عالي الدقة
- Error correction **Level H** (30%)
- **Logo المطعm** في المنتصف
- لون قابل للتخصيص (`qr_color`)

**SVG:** للطباعة الاحترافية (بدون logo)

---

## 10.3 Barcode 1D (Code128)

- يشفّر **نفس URL** الخاص بـ QR
- مناسب للطابعات الحرارية والملصقات
- Label: اسم المطعm + رقم الطاولة

---

## 10.4 PDF للطباعة

- `GET /api/v1/restaurants/{slug}/download_qrs/?tables=20`
- صفحة لكل طاولة: QR + رقم + اسم المطعm
- جاهز للطباعة A4

---

## 10.5 إدارة الطاولات

| العملية | الوصف |
|---------|-------|
| **توليد bulk** | 1-100 طاولة دفعة واحدة |
| **إضافة واحدة** | طاولة برقم مخصص |
| **حذف** | حذف طاولة + QR |
| **تحميل PNG/SVG/Barcode** | لكل طاولة |

---

# 11. العروض والخصومات

## 11.1 أنواع العروض الأربعة

### 1. Happy Hour — `happy_hour`

**الاستخدام:** خصم في أوقات محددة.

**الإعداد:**
- `start_time`: 16:00
- `end_time`: 19:00
- `days_of_week`: [0,1,2,3,4] (الأحد-الخميس)
- `discount_percent`: 20%

**مثال:** "خصم 20% من 4 مساءً إلى 7 مساءً"

---

### 2. خصم على قسم — `category_discount`

**الاستخدام:** خصم على أصناف قسم معين.

**الإعداد:**
- `category`: قسم "مشروبات"
- `discount_percent`: 15%

**مثال:** "خصم 15% على كل المشروبات"

---

### 3. اشترِ X واحصل Y — `buy_x_get_y`

**الاستخدام:** عروض الكمية.

**الإعداد:**
- `buy_quantity`: 2
- `get_quantity`: 1
- `category`: (اختياري — قسم محدد)

**مثال:** "اشترِ 2 بيتزا واحصل على 1 مجاناً"

**المنطق:** أرخص الأصناف في المجموعة تكون مجانية.

---

### 4. كوبون — `coupon`

**الاستخدام:** كود يُدخله الزبون في السلة.

**الإعداد:**
- `coupon_code`: SAVE10
- `discount_percent`: 10% أو `discount_amount`: 5000

**مثال:** الزبون يكتب `SAVE10` في السلة → خصم 10%

---

## 11.2 كيف تُطبَّق الخصومات؟

```
إجمالي الأصناف (Subtotal)
    ↓
+ خصم القسم (category_discount)
+ Buy X Get Y (أصناف مجانية)
+ Happy Hour (على الإجمالي)
+ الكوبون (إن وُجد)
    ↓
= الإجمالي النهائي (لا يقل عن 0)
```

**الملف:** `menu/promotion_service.py`

---

## 11.3 واجهة العميل

- **PromotionsBanner:** يظهر تحت Hero — العروض النشطة (غير الكوبونات)
- **CartDrawer:** حقل "كود الخصم" — للكوبونات

---

# 12. الحجوزات وقائمة الانتظار

## 12.1 من جهة العميل

**الوصول:** زر **"حجز"** في Header المنيو

### تبويب "حجز"
- الاسم
- الهاتف
- عدد الأشخاص
- التاريخ والوقت
- ملاحظات

### تبويب "انتظار"
- الاسم
- الهاتف
- عدد الأشخاص
- ملاحظات

**API:**
- `POST /api/v1/reservations/` (AllowAny + tenant)
- `POST /api/v1/waitlist/` (AllowAny + tenant)

---

## 12.2 من جهة المطعm (Dashboard)

**تبويب "الحجوزات":**

### الحجوزات
| الحالة | الإجراء |
|--------|---------|
| `pending` | ⏳ انتظار → **تأكيد** |
| `confirmed` | ✅ مؤكد |
| `cancelled` | ❌ ملغي |
| `completed` | ✔️ مكتمل |

### قائمة الانتظار
| الحالة | الإجراء |
|--------|---------|
| `waiting` | ⏳ → **جلوس (Seat)** |
| `seated` | ✅ تم الجلوس |

---

# 13. لوحة الإحصائيات والتحليلات

**الوصول:** Dashboard → تبويب **"الإحصائيات"**

**API:** `GET /api/v1/analytics/?period=day|week|month`

## 13.1 بطاقات KPI

| المؤشر | الوصف |
|--------|-------|
| **الإيرادات** | مجموع `total_amount` للطلبات |
| **عدد الطلبات** | في الفترة المحددة |
| **طلبات اليوم** | طلبات اليوم الحالي |
| **متوسط التحضير** | من `preparing_at` → `ready_at` (دقائق) |

## 13.2 الرسوم البيانية

| الرسم | الوصف |
|-------|-------|
| **المبيعات اليومية** | Bar chart — إيرادات كل يوم |
| **أوقات الذروة** | Heatmap — أكثر الساعات طلباً |

## 13.3 قوائم

| القائمة | الوصف |
|---------|-------|
| **الأكثر مبيعاً** | Top items by quantity |
| **آخر التقييمات** | Experience reviews |

---

# 14. شاشة المطبخ (Kitchen Display)

**الوصول:** `/kitchen` (JWT مطلوب)

## 14.1 الواجهة

```
┌─────────────────────────────────────────────────────────┐
│  🍳 شاشة المطبخ — مطعm الشمس          [🔄] [🔊] [خروج] │
├─────────────────────────────────────────────────────────┤
│  [قيد الانتظار (3)] [تحضير (2)] [جاهز (1)] [الكل]      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ #47 طاولة 5  │  │ #48 طاولة 2  │  │ #49 طاولة 8  │  │
│  │ 2x كباب      │  │ 1x بيتza     │  │ 3x عصير      │  │
│  │ 1x حمص       │  │              │  │              │  │
│  │ [تحضير ▶]    │  │ [تحضير ▶]    │  │ [تحضير ▶]    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 14.2 دورة حياة الطلب

```
pending ──▶ preparing ──▶ ready ──▶ completed
   │                                    │
   └────────── cancelled ◀──────────────┘
```

| الحالة | العربي | الإجراء |
|--------|--------|---------|
| `pending` | قيد الانتظار | → تحضير |
| `preparing` | تحضير | → جاهز |
| `ready` | جاهز | → مكتمل |
| `completed` | مكتمل | — |
| `cancelled` | ملغي | — |

**API:** `POST /api/v1/orders/{id}/update_status/`

## 14.3 WebSocket — التحديث الفوري

**Endpoint:** `ws://host/ws/kitchen/?token=JWT&tenant=slug`

**الأحداث:**
| Event | متى |
|-------|-----|
| `order.created` | طلب جديد |
| `order.updated` | تغيير حالة |
| `table_call.created` | طلب نادل |
| `table_call.resolved` | تم التعامل |

**Fallback:** Polling كل 5 ثوانٍ إذا WebSocket غير متاح.

## 14.4 طلبات النادل (Table Calls)

| النوع | الوصف |
|-------|-------|
| `waiter` | طلب نادل |
| `bill` | طلب الفاتورة |
| `other` | طلب آخر |

---

# 15. دليل العميل — تجربة المنيو الرقمي

## 15.1 الوصول للمنيو

### الطريقة 1: QR (الأكثر شيوعاً)
1. امسح QR على الطاولة بالكamera
2. يفتح المتصفح تلقائياً
3. المنيو جاهز — **بدون تحميل تطبيق**

### الطريقة 2: رابط مباشر
```
https://shams.emenu.com/?table=5
```

### الطريقة 3: Subdomain
```
https://shams.emenu.com/
```

---

## 15.2 شاشة المنيو — المكوّنات

```
┌─────────────────────────────┐
│  [EN|عربي] [☀️|🌙] [حجز] [⭐] │  ← Header
├─────────────────────────────┤
│  🏪 مطعm الشمس              │
│  ⭐ 4.5 · 🟢 مفتوح            │  ← Hero
│  [صورة الغلاف]               │
├─────────────────────────────┤
│  🏷️ Happy Hour — خصم 20%     │  ← PromotionsBanner
├─────────────────────────────┤
│  🔍 [بحث...]  [مشاوي|مقبلات] │  ← Navigation
├─────────────────────────────┤
│  ┌─────┐ ┌─────┐            │
│  │ 🍖  │ │ 🥗  │            │  ← Menu Cards
│  │كباب │ │حمص  │            │
│  │15k  │ │5k   │            │
│  └─────┘ └─────┘            │
├─────────────────────────────┤
│  [🛒 السلة — 25,000 د.ع]    │  ← Cart FAB
└─────────────────────────────┘
```

---

## 15.3 إضافة صنف للسلة

1. **اضغط على الصنف** → يفتح `ModifiersDrawer`
2. اختر **الحجم** (Variant) إن وُجد
3. اختر **الإضافات** (Addons) إن وُجدت
4. اضغط **"أضف للسلة"**

---

## 15.4 إرسال الطلب

1. اضغط **"السلة"** في الأسفل
2. راجع الأصناف والكميات
3. (اختياري) أدخل **كود الخصم**
4. (إن General mode) أدخل **رقم الطاولة**
5. اضغط **"تأكيد الطلب الآن"**

**ماذا يحدث:**
- ✅ الطلب يُرسل للمطبخ (WebSocket)
- ✅ رسالة نجاح
- ✅ فتح WhatsApp (إن وُجد `whatsapp_number`) مع تفاصيل الطلب

---

## 15.5 طلب النادل

- زر عائم **"طلب النادل"** (أسفل يسار)
- اختر: **نادل** / **فاتورة** / **أخرى**
- يظهر في شاشة المطبخ فوراً

---

## 15.6 التقييم

- زر **"تقييم ⭐"** في Header
- اختر 1-5 نجوم
- اكتب تعليق (اختياري)
- يُحفظ كـ `ExperienceReview`

---

## 15.7 الحجز

- زر **"حجز 📅"** في Header
- **حجز:** تاريخ + وقت + عدد أشخاص
- **انتظار:** للانضمام لقائمة الانتظار

---

## 15.8 تبديل اللغة والمظهر

| الزر | الوظيفة |
|------|---------|
| **EN / عربي** | تبديل اللغة + اتجاه RTL/LTR |
| **☀️ / 🌙** | Light / Dark mode |

---

# 16. مدير المنصة (Super Admin)

**الوصول:** `/platform` (يتطلب `is_superuser=True`)

## 16.1 بطاقات الإحصائيات

| البطاقة | الوصف |
|---------|-------|
| إجمالي المطاعm | كل المسجلة |
| المطاعm النشطة | trial + active |
| MRR تقديري | pro × 49,000 د.ع |
| طلبات الشهر | كل المنصة |

## 16.2 إدارة كل مطعm

لكل مطعm في القائمة:

| المعلومة | الوصف |
|----------|-------|
| الاسم + slug | معرف المطعm |
| المالك | username |
| حالة الاشتراك | trial/active/suspended |
| Custom domain | إن وُجد |
| الموقع | lat/lng على OpenStreetMap |

| الزر | الوظيفة |
|------|---------|
| **+30 يوم** | تمديد الاشتراك |
| **إيقاف** | suspended |
| **تفعيل/تعطيل** | is_active toggle |

**API:**
- `GET /api/v1/platform/stats/`
- `PATCH /api/v1/platform/restaurants/{id}/subscription/`

---

# 17. White-Label والدومين المخصص

## 17.1 Subdomain (الافتراضي)

```
shams.emenu.com  →  مطعm الشمس
cafe.emenu.com   →  كافيه بغداد
```

**الإعداد:** تلقائي عند التسجيل — slug من اسم المطعm.

---

## 17.2 Custom Domain (Enterprise)

```
menu.alshams.com  →  مطعm الشمس
```

**الإعداد:**
1. Super Admin يضيف `custom_domain` في Django Admin
2. DNS: CNAME → `emenu.com`
3. Nginx/Certbot يُعدّ SSL تلقائياً

**الملف:** `menu/tenancy.py` — `resolve_tenant_slug()`

---

## 17.3 إخفاء Branding المنصة

- `hide_platform_branding=True` على Restaurant
- يخفي "صُمم بواسطة E-Menu" من Footer
- متاح في خطة Enterprise

---

## 17.4 ثيمات Landing

| الثيم | الوصف |
|-------|-------|
| `default` | E-Menu Pro standard |
| `luxury` | فاخر — ذهبي/أسود |
| `minimal` | Minimal — أبيض/نظيف |
| `heritage` | تراثي — دافئ |

---

# 18. المصادقة والأمان

## 18.1 تسجيل مطعm جديد

```
POST /api/v1/auth/register/
{
  "username": "shams_admin",
  "password": "securepass123",
  "restaurant_name": "مطعm الشمس",
  "email": "owner@shams.com",
  "phone": "07701234567"
}

→ User + Restaurant (trial 14 days) + JWT tokens
```

---

## 18.2 تسجيل الدخول

```
POST /api/v1/auth/login/
{ "username": "...", "password": "..." }

→ { access, refresh }

GET /api/v1/auth/me/
→ { user, restaurants[] }
```

---

## 18.3 Cross-Subdomain Handoff

**المشكلة:** JWT لا يُشارك بين `emenu.com` و `shams.emenu.com`

**الحل:**
```
1. POST /api/v1/auth/handoff/  → one-time code (120s TTL)
2. Redirect: shams.emenu.com/dashboard?handoff=CODE
3. POST /api/v1/auth/handoff/consume/  → tokens
4. Code يُحذف (single-use)
```

---

## 18.4 JWT Refresh

- Access token: قصير العمر
- Refresh token: تجديد تلقائي
- 401 → refresh → retry أو logout

---

## 18.5 أمان Multi-Tenant

- `validate_public_tenant_match()` — يمنع كتابة بيانات لمطعm آخر
- `tenant_scoped_queryset()` — فلترة تلقائية
- Suspended tenant → 403 للزوار

---

# 19. التشغيل والنشر التقني

## 19.1 التطوير المحلي

### المتطلبات
- Python 3.10+
- Node.js 18+
- (اختياري) Redis للWebSocket

### Backend
```powershell
cd d:\E-Menu
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

### URLs
| الخدمة | URL |
|--------|-----|
| Backend API | http://localhost:8000/api/v1/ |
| Frontend | http://localhost:5173/ |
| Django Admin | http://localhost:8000/admin/ |
| Demo Menu | http://localhost:5173/r/shams?table=1 |

### Seed Demo Data
```powershell
python manage.py seed_demo_menu
```

---

## 19.2 Docker Production

```bash
cp .env.example .env
# عدّل: SECRET_KEY, DATABASE_URL, REDIS_URL, EMENU_BASE_DOMAIN

docker-compose up -d
```

| Service | الدور |
|---------|-------|
| `db` | PostgreSQL 16 |
| `redis` | WebSocket channel layer |
| `backend` | Django + Daphne |
| `frontend` | Nginx static |
| `nginx` | Reverse proxy + SSL |
| `certbot` | Let's Encrypt |

---

## 19.3 متغيرات البيئة (.env)

| المتغير | الوصف | مثال |
|---------|-------|------|
| `SECRET_KEY` | Django secret | random string |
| `DEBUG` | وضع التطوير | False |
| `DATABASE_URL` | PostgreSQL | postgres://... |
| `REDIS_URL` | Redis | redis://redis:6379 |
| `EMENU_BASE_DOMAIN` | دومين المنصة | emenu.com |
| `ALLOWED_HOSTS` | hosts مسموحة | emenu.com,*.emenu.com |
| `CORS_ALLOWED_ORIGINS` | CORS | https://emenu.com |

---

## 19.4 الاختبارات

```powershell
# Django tests
python manage.py test menu.tests

# QA شامل
python scripts/qa_run_all.py

# Frontend build
cd frontend && npm run build
```

---

# 20. مرجع الروابط والمسارات

## 20.1 روابط التطوير المحلي

| الصفحة | الرابط |
|--------|--------|
| Landing | http://localhost:5173/ |
| Login | http://localhost:5173/login |
| Dashboard | http://localhost:5173/dashboard |
| Kitchen | http://localhost:5173/kitchen |
| Platform Admin | http://localhost:5173/platform |
| Demo Menu | http://localhost:5173/r/shams?table=1 |
| Health Check | http://localhost:8000/api/v1/health/ |
| Django Admin | http://localhost:8000/admin/ |

## 20.2 روابط API الأساسية

| Method | Endpoint | Auth | الوصف |
|--------|----------|------|-------|
| GET | `/api/v1/health/` | — | Health check |
| POST | `/api/v1/auth/register/` | — | تسجيل |
| POST | `/api/v1/auth/login/` | — | دخول |
| GET | `/api/v1/auth/me/` | JWT | المستخدم |
| GET | `/api/v1/restaurants/` | — | قائمة مطاعm |
| GET | `/api/v1/restaurants/{slug}/public_menu/` | — | منيو |
| POST | `/api/v1/orders/` | — | إنشاء طلب |
| GET | `/api/v1/orders/kitchen/` | JWT | طلبات المطبخ |
| GET | `/api/v1/analytics/` | JWT | إحصائيات |
| GET | `/api/v1/promotions/active/` | — | عروض نشطة |
| POST | `/api/v1/reservations/` | — | حجز |
| POST | `/api/v1/waitlist/` | — | انتظار |
| GET | `/api/v1/platform/stats/` | Super | إحصائيات المنصة |
| WS | `/ws/kitchen/` | JWT | WebSocket |

---

# 21. الأسئلة الشائعة (FAQ)

## س: هل يحتاج الزبون تطبيق؟
**ج:** لا. المنيو يعمل في المتصفh (Safari/Chrome) — فقط امسح QR.

## س: هل يوجد دفع إلكتروني؟
**ج:** حالياً الطلب يُرسل للمطبخ + رابط WhatsApp. الدفع الإلكتروني غير مدمج بعد.

## س: كم صنف أستطيع إضافة؟
**ج:** Basic: حتى 50 صنف. Pro/Enterprise: غير محدود عملياً.

## س: هل أستطيع ربط أكثر من مطعm؟
**ج:** Enterprise فقط — multi-restaurant per owner.

## س: ماذا يحدث بعد انتهاء Trial؟
**ج:** Super Admin يمدّد أو يوقف. Dashboard يُظهر تحذير قبل 7 أيام.

## س: هل المنيو يعمل offline؟
**ج:** Service Worker مسجّل (`/sw.js`) — cache محدود. يحتاج إنترنت للطلبات.

## س: كيف أغيّر slug المطعm؟
**ج:** slug يُولَّد تلقائياً من الاسم. للتغيير: Django Admin → Restaurant → slug.

## س: هل WebSocket ضروري؟
**ج:** لا — Kitchen يعمل بـ polling fallback (5s). WebSocket أسرع.

## س: كيف أضيف Super Admin؟
**ج:** Django Admin → Users → is_superuser = True

## س: هل أستطيع تخصيص ثيم بالكامل؟
**ج:** 10 ثيمات جاهزة + ألوان مخصصة. CSS كامل = Enterprise.

## س: ما الفرق بين QR و Barcode؟
**ج:** نفس المحتوى (URL). QR للمسح بالكamera. Barcode 1D للطابعات الحرارية.

## س: كيف يعرف النظام رقم الطاولة؟
**ج:** Per-Table: من QR (`?table=5`). General: الزبون يُدخله يدوياً.

---

# 22. ملحق: قائمة API الرئيسية

## Auth
```
POST   /api/v1/auth/register/
POST   /api/v1/auth/login/
POST   /api/v1/auth/refresh/
GET    /api/v1/auth/me/
POST   /api/v1/auth/handoff/
POST   /api/v1/auth/handoff/consume/
```

## Restaurants
```
GET    /api/v1/restaurants/
GET    /api/v1/restaurants/my/
GET    /api/v1/restaurants/{slug}/public_menu/
PATCH  /api/v1/restaurants/{slug}/branding/
GET    /api/v1/restaurants/{slug}/qr-general/
GET    /api/v1/restaurants/{slug}/barcode-general/
GET    /api/v1/restaurants/{slug}/download_qrs/
```

## Menu
```
GET/POST/PATCH/DELETE  /api/v1/categories/
POST                   /api/v1/categories/reorder/
GET/POST/PATCH/DELETE  /api/v1/items/
POST                   /api/v1/items/reorder/
POST                   /api/v1/items/{id}/toggle_stock/
GET/POST/PATCH/DELETE  /api/v1/variants/
GET/POST/PATCH/DELETE  /api/v1/addon-groups/
```

## Operations
```
POST   /api/v1/orders/
GET    /api/v1/orders/kitchen/
GET    /api/v1/orders/live/
POST   /api/v1/orders/{id}/update_status/
GET/POST  /api/v1/table-calls/
POST   /api/v1/table-calls/{id}/resolve/
GET/POST/DELETE  /api/v1/tables/
POST   /api/v1/tables/bulk-generate/
GET    /api/v1/tables/{id}/qr/
GET    /api/v1/tables/{id}/barcode/
```

## Reviews & Promotions
```
POST   /api/v1/reviews/
POST   /api/v1/experience-reviews/
GET/POST/PATCH/DELETE  /api/v1/promotions/
GET    /api/v1/promotions/active/
```

## Reservations
```
GET/POST  /api/v1/reservations/
POST      /api/v1/reservations/{id}/confirm/
GET/POST  /api/v1/waitlist/
POST      /api/v1/waitlist/{id}/seat/
```

## Platform
```
GET    /api/v1/analytics/
GET    /api/v1/platform/stats/
GET    /api/v1/platform/restaurants/
PATCH  /api/v1/platform/restaurants/{id}/subscription/
GET    /api/v1/platform/branding/
POST   /api/v1/contact/
GET    /api/v1/health/
```

## WebSocket
```
WS     /ws/kitchen/?token=JWT&tenant=slug
Events: order.created, order.updated, table_call.created, table_call.resolved
```

---

## Headers مهمة

| Header | الاستخدام |
|--------|-----------|
| `Authorization: Bearer {JWT}` | طلبات محمية |
| `X-Tenant-Slug: shams` | تحديد المستأجر |
| `Content-Type: application/json` | POST/PATCH |

---

> **نهاية الدليل**  
> للدعم: راجع `QA_REPORT.md` للاختبارات، أو `.env.example` للإعداد التقني.  
> **E-Menu Pro** — منصة المنيو الرقمي للمطاعm العربية 🍽️
