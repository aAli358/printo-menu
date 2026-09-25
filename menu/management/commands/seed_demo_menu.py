"""
Seed demo menu categories & items with food images for design preview.
Usage: python manage.py seed_demo_menu
       python manage.py seed_demo_menu --clear
"""
import urllib.request
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from menu.models import Category, MenuItem, MenuItemReview, Restaurant

# Unsplash food images (free, hotlink-friendly)
IMAGES = {
    'hummus': 'https://images.unsplash.com/photo-1626645737368-0a8a517e0a9c?w=800&q=80',
    'falafel': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
    'tabbouleh': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'kebab': 'https://images.unsplash.com/photo-1529042410759-befb1204b916?w=800&q=80',
    'grill': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    'chicken': 'https://images.unsplash.com/photo-1598103442097-8b74394a95b6?w=800&q=80',
    'rice': 'https://images.unsplash.com/photo-1516684732162-798a0062be75?w=800&q=80',
    'mansaf': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    'salad': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
    'dessert': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    'kunafa': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
    'juice': 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&q=80',
    'tea': 'https://images.unsplash.com/photo-1556678153-0880c1153e28?w=800&q=80',
    'coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    'latte': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80',
    'croissant': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
    'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
    'burger': 'https://images.unsplash.com/photo-1568901346735-0665a995a3f3?w=800&q=80',
    'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
    'smoothie': 'https://images.unsplash.com/photo-1505252585467-12605468b060?w=800&q=80',
    'breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
    'cover_grill': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    'cover_cafe': 'https://images.unsplash.com/photo-1453614512568-c402110d13e0?w=1200&q=80',
    'icon_appetizer': 'https://images.unsplash.com/photo-1626645737368-0a8a517e0a9c?w=200&q=80',
    'icon_grill': 'https://images.unsplash.com/photo-1529042410759-befb1204b916?w=200&q=80',
    'icon_main': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80',
    'icon_salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80',
    'icon_dessert': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=80',
    'icon_drinks': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80',
    'icon_coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80',
    'icon_pastry': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&q=80',
    'icon_breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&q=80',
}

SHAMS_MENU = {
    'theme': 'arabesque',
    'cover': 'cover_grill',
    'categories': [
        {
            'name': 'مقبلات', 'name_en': 'Appetizers', 'icon': 'icon_appetizer',
            'items': [
                {'name': 'حمص بالطحينة', 'name_en': 'Hummus with Tahini', 'desc': 'حمص طازج مع طحينة وزيت زيتون', 'desc_en': 'Fresh hummus with tahini and olive oil', 'price': 5000, 'img': 'hummus', 'tags': ['Vegan', 'New']},
                {'name': 'فلافل مقرمش', 'name_en': 'Crispy Falafel', 'desc': '6 قطع فلافل مع صلصة طحينة', 'desc_en': '6 pieces with tahini sauce', 'price': 6000, 'img': 'falafel', 'tags': ['Vegan', 'Spicy']},
                {'name': 'تبولة', 'name_en': 'Tabbouleh', 'desc': 'سلطة بقدونس وبرغل وطماطم', 'desc_en': 'Parsley, bulgur and tomato salad', 'price': 5500, 'img': 'tabbouleh', 'tags': ['Vegan']},
                {'name': 'متبل باذنجان', 'name_en': 'Baba Ghanoush', 'desc': 'باذنجان مشوي مع طحينة', 'desc_en': 'Smoky roasted eggplant dip', 'price': 5500, 'img': 'hummus', 'tags': ['Vegan']},
            ],
        },
        {
            'name': 'مشاوي', 'name_en': 'Grills', 'icon': 'icon_grill',
            'items': [
                {'name': 'كباب لحم', 'name_en': 'Lamb Kebab', 'desc': '4 أسياخ لحم مشوي على الفحم', 'desc_en': '4 charcoal-grilled lamb skewers', 'price': 18000, 'img': 'kebab', 'tags': ['Spicy', 'New']},
                {'name': 'تكة دجاج', 'name_en': 'Chicken Tikka', 'desc': 'دجاج متبل ومشوي', 'desc_en': 'Marinated grilled chicken', 'price': 14000, 'img': 'chicken', 'tags': []},
                {'name': 'مشاوي مشكلة', 'name_en': 'Mixed Grill Platter', 'desc': 'تشكيلة مشاوي للشخصين', 'desc_en': 'Assorted grill for two', 'price': 35000, 'img': 'grill', 'tags': ['New']},
                {'name': 'كباب لحم مفروم', 'name_en': 'Koobideh Kebab', 'desc': 'لحم مفروم متبل مشوي', 'desc_en': 'Seasoned minced meat kebab', 'price': 16000, 'img': 'kebab', 'tags': ['Spicy']},
            ],
        },
        {
            'name': 'أطباق رئيسية', 'name_en': 'Main Courses', 'icon': 'icon_main',
            'items': [
                {'name': 'منسف لحم', 'name_en': 'Lamb Mansaf', 'desc': 'لحم مع أرز ولبن جميد', 'desc_en': 'Lamb with rice and jameed sauce', 'price': 22000, 'img': 'mansaf', 'tags': []},
                {'name': 'دجاج بالأرز', 'name_en': 'Chicken Mandi', 'desc': 'دجاج مطبوخ على البخار مع أرز', 'desc_en': 'Steamed chicken with spiced rice', 'price': 15000, 'img': 'rice', 'tags': ['New']},
                {'name': 'برجر شمس', 'name_en': 'Shams Signature Burger', 'desc': 'برجر لحم 200غ مع بطاطا', 'desc_en': '200g beef burger with fries', 'price': 12000, 'img': 'burger', 'tags': []},
                {'name': 'بيتza مارgherita', 'name_en': 'Margherita Pizza', 'desc': 'بيتza إيطالية كلاسيكية', 'desc_en': 'Classic Italian pizza', 'price': 13000, 'img': 'pizza', 'tags': []},
            ],
        },
        {
            'name': 'سلطات', 'name_en': 'Salads', 'icon': 'icon_salad',
            'items': [
                {'name': 'سلطة سيزر', 'name_en': 'Caesar Salad', 'desc': 'خس، دجاج، بارميزان', 'desc_en': 'Lettuce, chicken, parmesan', 'price': 9000, 'img': 'salad', 'tags': []},
                {'name': 'سلطة يونانية', 'name_en': 'Greek Salad', 'desc': 'طماطم، خيار، جبنة فيتا', 'desc_en': 'Tomato, cucumber, feta cheese', 'price': 8500, 'img': 'salad', 'tags': ['Vegan']},
                {'name': 'سلطة فواكه', 'name_en': 'Fruit Salad', 'desc': 'فواكه موسمية طازجة', 'desc_en': 'Fresh seasonal fruits', 'price': 7000, 'img': 'smoothie', 'tags': ['Vegan', 'New']},
            ],
        },
        {
            'name': 'حلويات', 'name_en': 'Desserts', 'icon': 'icon_dessert',
            'items': [
                {'name': 'كنافة نابلسية', 'name_en': 'Kunafa', 'desc': 'كنافة بالجبنة والقطر', 'desc_en': 'Cheese kunafa with syrup', 'price': 8000, 'img': 'kunafa', 'tags': ['New']},
                {'name': 'cheesecake', 'name_en': 'Cheesecake', 'desc': 'تشيز كيك بالتوت', 'desc_en': 'Berry cheesecake slice', 'price': 7500, 'img': 'dessert', 'tags': []},
                {'name': 'آيس كريم', 'name_en': 'Ice Cream', 'desc': '3 كرات بنكهات متنوعة', 'desc_en': '3 scoops assorted flavors', 'price': 6000, 'img': 'dessert', 'tags': []},
            ],
        },
        {
            'name': 'مشروبات', 'name_en': 'Drinks', 'icon': 'icon_drinks',
            'items': [
                {'name': 'عصير برتقال طازج', 'name_en': 'Fresh Orange Juice', 'desc': 'عصير برتقال طبيعي', 'desc_en': 'Freshly squeezed orange', 'price': 5000, 'img': 'juice', 'tags': ['Vegan', 'New']},
                {'name': 'شاي أحمر', 'name_en': 'Red Tea', 'desc': 'شاي عراقي تقليدي', 'desc_en': 'Traditional Iraqi tea', 'price': 2000, 'img': 'tea', 'tags': []},
                {'name': 'ليمونada بالنعناع', 'name_en': 'Lemon Mint', 'desc': 'ليمونada منعشة بالنعناع', 'desc_en': 'Refreshing lemon mint drink', 'price': 4500, 'img': 'juice', 'tags': ['Vegan']},
            ],
        },
    ],
}

YOB_MENU = {
    'theme': 'coffee-roast',
    'cover': 'cover_cafe',
    'categories': [
        {
            'name': 'قهوة', 'name_en': 'Coffee', 'icon': 'icon_coffee',
            'items': [
                {'name': 'إسبرesso', 'name_en': 'Espresso', 'desc': 'قهوة إيطالية مركزة', 'desc_en': 'Bold Italian espresso shot', 'price': 4000, 'img': 'coffee', 'tags': []},
                {'name': 'لاتte', 'name_en': 'Latte', 'desc': 'إسبرesso مع حليب مبخر', 'desc_en': 'Espresso with steamed milk', 'price': 6000, 'img': 'latte', 'tags': ['New']},
                {'name': 'كappuccino', 'name_en': 'Cappuccino', 'desc': 'رغوة حليب كثيفة', 'desc_en': 'Rich milk foam', 'price': 6500, 'img': 'latte', 'tags': []},
                {'name': 'موcha', 'name_en': 'Mocha', 'desc': 'قهوة مع شokolade', 'desc_en': 'Coffee with chocolate', 'price': 7000, 'img': 'coffee', 'tags': ['New']},
            ],
        },
        {
            'name': 'مشروبات باردة', 'name_en': 'Cold Drinks', 'icon': 'icon_drinks',
            'items': [
                {'name': 'آيس لاتte', 'name_en': 'Iced Latte', 'desc': 'لاتte بارد مع ثلج', 'desc_en': 'Iced latte over ice', 'price': 7000, 'img': 'latte', 'tags': ['New']},
                {'name': 'smoothie فراولة', 'name_en': 'Strawberry Smoothie', 'desc': 'فراولة طازجة مع زبادي', 'desc_en': 'Fresh strawberry yogurt blend', 'price': 8000, 'img': 'smoothie', 'tags': ['Vegan']},
                {'name': 'عصير مانgo', 'name_en': 'Mango Juice', 'desc': 'عصير مانgo استوائي', 'desc_en': 'Tropical mango juice', 'price': 5500, 'img': 'juice', 'tags': ['Vegan']},
            ],
        },
        {
            'name': 'حلويات', 'name_en': 'Pastries', 'icon': 'icon_pastry',
            'items': [
                {'name': 'كرواسون', 'name_en': 'Croissant', 'desc': 'كرواسون فرنسي طازج', 'desc_en': 'Fresh French croissant', 'price': 4500, 'img': 'croissant', 'tags': ['New']},
                {'name': 'cheesecake', 'name_en': 'Cheesecake', 'desc': 'تشيز كيك كريمي', 'desc_en': 'Creamy cheesecake slice', 'price': 7500, 'img': 'cake', 'tags': []},
                {'name': 'برownie', 'name_en': 'Brownie', 'desc': 'برownie شokolade ساخن', 'desc_en': 'Warm chocolate brownie', 'price': 6000, 'img': 'dessert', 'tags': ['Spicy']},
                {'name': 'muffin توت', 'name_en': 'Blueberry Muffin', 'desc': 'muffin بالتوت الأزرق', 'desc_en': 'Blueberry muffin', 'price': 5000, 'img': 'cake', 'tags': []},
            ],
        },
        {
            'name': 'فطور', 'name_en': 'Breakfast', 'icon': 'icon_breakfast',
            'items': [
                {'name': 'فطور yob', 'name_en': 'Yob Breakfast', 'desc': 'بيض، خبز، جبنة، زيتون', 'desc_en': 'Eggs, bread, cheese, olives', 'price': 12000, 'img': 'breakfast', 'tags': ['New']},
                {'name': 'وaffle', 'name_en': 'Waffle', 'desc': 'وaffle مع عسل وfruits', 'desc_en': 'Waffle with honey and fruits', 'price': 9000, 'img': 'breakfast', 'tags': []},
                {'name': 'pancakes', 'name_en': 'Pancakes', 'desc': '3 pancakes مع maple syrup', 'desc_en': '3 pancakes with maple syrup', 'price': 8500, 'img': 'breakfast', 'tags': ['New']},
                {'name': 'sandwich avo', 'name_en': 'Avocado Toast', 'desc': 'خبز محمص مع أفokado', 'desc_en': 'Toasted bread with avocado', 'price': 8000, 'img': 'breakfast', 'tags': ['Vegan']},
            ],
        },
        {
            'name': 'وجبات خفيفة', 'name_en': 'Snacks', 'icon': 'icon_main',
            'items': [
                {'name': 'ساندwich club', 'name_en': 'Club Sandwich', 'desc': 'دجاج، خس، طماطم', 'desc_en': 'Chicken, lettuce, tomato', 'price': 10000, 'img': 'burger', 'tags': []},
                {'name': 'pasta alfredo', 'name_en': 'Pasta Alfredo', 'desc': 'pasta بصوص كريمة', 'desc_en': 'Creamy alfredo pasta', 'price': 11000, 'img': 'pasta', 'tags': []},
                {'name': 'salad bowl', 'name_en': 'Power Bowl', 'desc': 'quinoa، avo، خضار', 'desc_en': 'Quinoa, avocado, greens', 'price': 9500, 'img': 'salad', 'tags': ['Vegan', 'New']},
            ],
        },
    ],
}

MENUS = {
    'shams': SHAMS_MENU,
    'yob': YOB_MENU,
}


def download_image(key: str) -> ContentFile | None:
    url = IMAGES.get(key)
    if not url:
        return None
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'E-Menu-Seeder/1.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        ext = 'jpg'
        return ContentFile(data, name=f'{key}.{ext}')
    except Exception:
        return None


def save_image_field(instance, field_name: str, image_key: str):
    content = download_image(image_key)
    if content:
        getattr(instance, field_name).save(content.name, content, save=False)


class Command(BaseCommand):
    help = 'Seed demo menu categories and food items with images'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Delete existing categories/items first')
        parser.add_argument('--slug', type=str, help='Seed only this restaurant slug')

    def handle(self, *args, **options):
        slugs = [options['slug']] if options['slug'] else list(MENUS.keys())
        total_cats = 0
        total_items = 0

        for slug in slugs:
            try:
                restaurant = Restaurant.objects.get(slug=slug)
            except Restaurant.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Skip: restaurant "{slug}" not found'))
                continue

            menu_data = MENUS[slug]

            if options['clear']:
                MenuItemReview.objects.filter(item__category__tenant=restaurant).delete()
                MenuItem.objects.filter(category__tenant=restaurant).delete()
                Category.objects.filter(tenant=restaurant).delete()

            restaurant.menu_theme = menu_data['theme']
            save_image_field(restaurant, 'cover_image', menu_data['cover'])
            restaurant.save()

            for cat_order, cat_data in enumerate(menu_data['categories']):
                category = Category.objects.create(
                    tenant=restaurant,
                    name=cat_data['name'],
                    name_en=cat_data['name_en'],
                    order=cat_order,
                    is_active=True,
                )
                save_image_field(category, 'icon', cat_data['icon'])
                category.save()
                total_cats += 1

                for item_order, item_data in enumerate(cat_data['items']):
                    item = MenuItem.objects.create(
                        category=category,
                        tenant=restaurant,
                        name=item_data['name'],
                        name_en=item_data['name_en'],
                        description=item_data['desc'],
                        description_en=item_data['desc_en'],
                        base_price=Decimal(str(item_data['price'])),
                        is_available=True,
                        tags=item_data.get('tags', []),
                        order=item_order,
                    )
                    save_image_field(item, 'image', item_data['img'])
                    item.save()
                    total_items += 1

                    # Reviews for featured carousel
                    if 'New' in item_data.get('tags', []):
                        MenuItemReview.objects.create(item=item, rating=5, comment='Excellent!')
                        MenuItemReview.objects.create(item=item, rating=4, comment='Very good')

            self.stdout.write(self.style.SUCCESS(f'OK: {slug} -> theme={menu_data["theme"]}'))

        self.stdout.write(self.style.SUCCESS(f'Done: {total_cats} categories, {total_items} items'))
